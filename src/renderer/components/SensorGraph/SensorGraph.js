import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Debug from 'debug';
import *as d3 from 'd3';

const debug = Debug('fabnavi:components:SensorGraph');


class SensorGraph extends React.Component {
    constructor(props) {
        super(props);

        this.margin = {
            top: 20,
            right: 40,
            bottom: 20,
            left: 40
        };

        this.size = {
            width: 650,
            height: 225
        };

        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        this.state = {
            svg: null,
            data: null,
            svg_list: [],
            ax: [],
            ay: [],
            az: [],
            gx: [],
            gy: [],
            gz: [],
        }

        this.line = [];
        this.label = ['ax', 'ay', 'az', 'gx', 'gy', 'gz', 'heartrate']
        this.playTimeBar;
        this.playLine;

        this.color_list = ['#f28c36', '#dc5462', '#629ac9', '#cfe43f', '#f8ea2d', '#8e37ca', '#f28c36']

        this.x = d3.scaleTime()
            .range([0, this.width]);

        this.y = d3.scaleLinear()
            .range([this.height, 0]);

        this.xAxis = d3.axisBottom()
            .scale(this.x)
            .tickFormat(d3.timeFormat('%H%M%S%L'));

        this.yAxis = d3.axisLeft()
            .scale(this.y)

        // zoomビヘイビアの設定
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', function () {
            });
    }

    onRef = (ref) => {
        this.setState({
            svg:
                d3.select(ref).attr('width', this.size.width)
                    .attr('height', this.size.height)
                    .append('g')
                    .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
        })
    }

    renderGraph = (data_url) => {
        if (this.props.data === 'left') {
            this.state.data = this.loadCSV(data_url)
        } else if (this.props.data === 'right') {
            this.state.data = this.loadCSV(data_url)
        }
        this.draw();
    }

    renderHeartRateGraph = (data_url) => {
        this.state.data = this.loadCSV(data_url)
        this.drawHeartRate();
    }

    draw() {
        const parseDate = d3.timeParse('%H%M%S%L');

        // SVG、縦横軸などの設定
        const rect = this.state.svg.append('rect')
            .attr('width', this.size.width)
            .attr('height', this.size.height)
            .style('fill', 'none')
            .style('pointer-events', 'all');

        let i = 0;

        for (i = 0; i < 6; i++) {
            this.line[i] = d3.line()
                .x(d => {
                    return this.x(d.date);
                })
                .y(d => {
                    switch (i) {
                        case 0:
                            return this.y(d.ax / 3);
                            break;

                        case 1:
                            return this.y(d.ay / 3);
                            break;

                        case 2:
                            return this.y(d.az / 3);
                            break;

                        case 3:
                            return this.y(d.gx / 3);
                            break;

                        case 4:
                            return this.y(d.gy / 3);
                            break;

                        case 5:
                            return this.y(d.gz / 3);
                            break;
                    }
                })
        }


        this.playLine = d3.line()
            .x(d => {
                return d[0];
            })
            .y(d => {
                return d[1];
            })

        // 描画
        this.state.data.forEach(d => {
            d.date = parseDate(d.date);
            d.ax = +d.ax;
            d.ay = +d.ay;
            d.az = +d.az;
            d.gx = +d.gx;
            d.gy = +d.gy;
            d.gz = +d.gz;
        });

        this.x.domain(d3.extent(this.state.data, d => {
            return d.date;
        }));
        this.y.domain([-5, 5]);

        for (i = 0; i < 6; i++) {
            this.state.svg_list[i] = this.state.svg.append('path')
                .datum(this.state.data)
                .attr('class', 'line')
                .attr('id', this.label[i])
                .attr('stroke', this.color_list[i])
                .attr('d', this.line[i])
                .attr('fill', 'none');
        }

        this.playTimeBar = this.state.svg.append('path')
            .attr('d', this.playLine([[0, 0], [0, this.height]]))
            .attr('stroke', '#A9A9A9')
            .attr('stroke-width', '2px')
            .attr('fill', 'none')

        var brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on('brush end', () => {
                this.brushed(brush, this.x);
            });

        this.state.svg.append('g') //brushグループを作成
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('.brush rect')
            .attr('y', -6)
            .attr('height', this.height + 7);

        for (i = 0; i < 6; i++) {
            this.state.svg.selectAll('.circle')
                .data(this.state.data)
                .enter()
                .append('circle')
                .attr('r', '3px')
                .attr('cx', d => { return this.x(d.date) })
                .attr('cy', d => {

                    switch (i) {
                        case 0:
                            return this.y(d.ax / 3);
                            break;

                        case 1:
                            return this.y(d.ay / 3);
                            break;

                        case 2:
                            return this.y(d.az / 3);
                            break;

                        case 3:
                            return this.y(d.gx / 3);
                            break;

                        case 4:
                            return this.y(d.gy / 3);
                            break;

                        case 5:
                            return this.y(d.gz / 3);
                            break;
                    }
                })
                .attr('fill', 'rgba(0,0,0,0)')
                .on('click', d => {
                    const tapTime = d.date;
                    const beginTime = this.state.data[0].date;
                    this.props.changeCurrentTime(Math.floor((tapTime - beginTime) / 1000));
                })
        }

    }

    brushed(brush, x) {
        if (d3.event.selection != null) {
            if (d3.event.sourceEvent.type == 'mouseup') {
                this.s = d3.event.selection || x.range();
                this.props.setBrushedRange(this.s.map(x.invert, x).map((time => {
                    return Math.floor((time - this.state.data[0].date) / 1000);
                })));
                console.log(this.s.map(x.invert, x)[0])//+ ':' + this.s.map(x.invert, x)[0].getMilliseconds());
                console.log(this.s.map(x.invert, x)[1])//+ ':' + this.s.map(x.invert, x)[1].getMilliseconds());
            } else {
                this.props.setBrushedRange(null);
            }
        }
    }

    moveTimeBar(currentTime, duringTime) {
        var x = currentTime * (this.width / duringTime);
        if(isNaN(x)) x = 0;
        this.playTimeBar.transition()
            .attr('d', this.playLine([[x, 0], [x, this.height]]));
    }

    addItem(item) {

        const active = true
        const newOpacity = 1

        switch (item) {
            case 'ax':
                d3.selectAll('#ax').style('opacity', newOpacity);
                ax.active = active;
                break;

            case 'ay':
                d3.selectAll('#ay').style('opacity', newOpacity);
                ay.active = active;
                break;

            case 'az':
                d3.selectAll('#az').style('opacity', newOpacity);
                az.active = active;
                break;

            case 'gx':
                d3.selectAll('#gx').style('opacity', newOpacity);
                gx.active = active;
                break;

            case 'gy':
                d3.selectAll('#gy').style('opacity', newOpacity);
                gy.active = active;
                break;

            case 'gz':
                d3.selectAll('#gz').style('opacity', newOpacity);
                gz.active = active;
                break;
        }
    }
    removeItem(item) {

        const active = false
        const newOpacity = 0

        switch (item) {
            case 'ax':
                d3.selectAll('#ax').style('opacity', newOpacity);
                ax.active = active;
                break;

            case 'ay':
                d3.selectAll('#ay').style('opacity', newOpacity);
                ay.active = active;
                break;

            case 'az':
                d3.selectAll('#az').style('opacity', newOpacity);
                az.active = active;
                break;

            case 'gx':
                d3.selectAll('#gx').style('opacity', newOpacity);
                gx.active = active;
                break;

            case 'gy':
                d3.selectAll('#gy').style('opacity', newOpacity);
                gy.active = active;
                break;

            case 'gz':
                d3.selectAll('#gz').style('opacity', newOpacity);
                gz.active = active;
                break;
        }
    }

    drawHeartRate() {

        const parseDate = d3.timeParse('%H%M%S%L');

        const rect = this.state.svg.append('rect')
            .attr('width', this.size.width)
            .attr('height', this.size.height)
            .style('fill', 'none')
            .style('pointer-events', 'all');

        this.line[0] = d3.line()
            .x(d => {
                return this.x(d.date);
            })
            .y(d => {
                return this.y(d.heartrate);
            })


        this.playLine = d3.line()
            .x(d => {
                return d[0];
            })
            .y(d => {
                return d[1];
            })

        // 描画
        this.state.data.forEach(d => {
            d.date = parseDate(d.date);
            d.heartrate = +d.heartrate;
        });

        this.x.domain(d3.extent(this.state.data, d => {
            return d.date;
        }));
        this.y.domain([d3.min(this.state.data, d => {
            return d.heartrate;
        }), d3.max(this.state.data, d => {
            return d.heartrate;
        })]);

        // 4. Call the y axis in a group tag
        this.state.svg.append('g')
            .attr('class', 'y axis')
            .call(d3.axisLeft(this.y));

        this.state.svg_list[0] = this.state.svg.append('path')
            .datum(this.state.data)
            .attr('class', 'line')
            .attr('id', this.label[6])
            .attr('stroke', this.color_list[6])
            .attr('stroke-width', '3px')
            .attr('d', this.line[0])
            .attr('fill', 'none');

        this.playTimeBar = this.state.svg.append('path')
            .attr('d', this.playLine([[0, 0], [0, this.height]]))
            .attr('stroke', '#A9A9A9')
            .attr('stroke-width', '2px')
            .attr('fill', 'none')

        var brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on('brush end', () => {
                this.brushed(brush, this.x);
            });

        this.state.svg.append('g') //brushグループを作成
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('.brush rect')
            .attr('y', -6)
            .attr('height', this.height + 7);

        this.state.svg.selectAll('circle')
            .data(this.state.data)
            .enter()
            .append('circle')
            .attr('r', '3px')
            .attr('cx', this.line[0].x())
            .attr('cy', this.line[0].y())
            .attr('fill', 'rgba(0,0,0,0)')
            .on('click', d => {
                this.tapTime = d.date;
                this.beginTime = [0].date;
            })
    };

    loadCSV = (targetFile) => {

        var allData = [];

        var request = new XMLHttpRequest();
        request.open("get", targetFile, false);
        request.send(null);

        var csvData = request.responseText;

        var lines = csvData.split("\n");

        for (var i = 0; i < lines.length - 1; i++) {
            var wordSet = lines[i].split(",");
            var wordData = {
                date: wordSet[0],
                ax: wordSet[1],
                ay: wordSet[2],
                az: wordSet[3],
                gx: wordSet[4],
                gy: wordSet[5],
                gz: wordSet[6],
                heartrate: wordSet[7]
            };
            allData.push(wordData);
        }
        return allData;
    }

    render() {
        return (
            <div>
                <svg className="SensorGraph" ref={this.onRef}></svg>
            </div>
        );
    }

    componentWillReceiveProps(props) {
        if (props.project) {
            this.setState({ project: props.project });
            if (props.data === 'heartrate') {
                this.renderHeartRateGraph(props.project.sensor_infos[0].data.url);
            } else if (props.data === 'left') {
                if(props.project.sensor_infos[0].data.url.indexOf("left") >= 0){
                    this.renderGraph(props.project.sensor_infos[0].data.url);
                }else {
                    this.renderGraph(props.project.sensor_infos[1].data.url);
                }
            } else if (props.data === 'right') {
                if(props.project.sensor_infos[0].data.url.indexOf("right") >= 0){
                    this.renderGraph(props.project.sensor_infos[0].data.url);
                }else {
                    this.renderGraph(props.project.sensor_infos[1].data.url);
                }
            }
        }
    }
}

SensorGraph.propTypes = {
    project: PropTypes.object,
    data: PropTypes.string,
    changeCurrentTime: PropTypes.func,
    setBrushedRange: PropTypes.func,
};

const mapStateToProps = state => ({
    project: state.player.project,
});

export default connect(
    mapStateToProps,
    null,
    null,
    { withRef: true }
)(SensorGraph);