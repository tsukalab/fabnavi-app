import React from 'react';
import PropTypes from 'prop-types';
import Debug from 'debug';

import { connect } from 'react-redux';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.scss';
import ReactModal from 'react-modal';

import Player from './Player';
import { SaveButton } from '../stylesheets/application/ProjectEditForm';
import { TagListField, SensorGraphField, SensorGraphWrapper, ItemsWrapper, Item, CreateButton, InputTextWrapper,
    TaggingSensorGraph, AutomaticTaggingButton, ModalButtonOK, ModalButtonNO, ModalButtonWrapper } from '../stylesheets/sensor/SensorGraph';

import { updateProject } from '../actions/manager';
import SensorGraph from './SensorGraph/SensorGraph';
import TagList from './SensorGraph/TagList';
import api from '../utils/WebAPIUtils';

const modalStyles = {
    content: {
        top: '20%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-20%',
        transform: 'translate(-50%, -50%)'
    }
};

const debug = Debug('fabnavi:jsx:ProjectSensorTagging');

class ProjectSensorTagging extends React.Component {

    constructor(props) {
        super(props);

        this.currentShowGraph = 0;
        this.brushedRange = null;
        this.brushedTime = null;
        this.brushedSec = null;
        this.modalIsOpen = false;
        this.tags = []
        this.newTags = []

        this.state = {
            project: this.props.project,
            name: '',
            description: '',
            private: false,
            figures: [],
            captions: [],
            chapters: [],
            ax: true,
            ay: true,
            az: true,
            gx: true,
            gy: true,
            gz: true,
            currentMovie: 0,
        }

        this.openModal = () => {
            this.setState({ modalIsOpen: true });
        }

        this.closeModal = () => {
            this.setState({ modalIsOpen: false });
        }

        this.onChartItemsChange = e => {
            if (e.target.checked) {
                this.leftChart.getWrappedInstance().addItem(e.target.id.slice(0, 2))
                this.rightChart.getWrappedInstance().addItem(e.target.id.slice(0, 2))
            } else {
                this.leftChart.getWrappedInstance().removeItem(e.target.id.slice(0, 2))
                this.rightChart.getWrappedInstance().removeItem(e.target.id.slice(0, 2))
            }
        }

        this.handleSelect = index => {
            if (index == 0) {
                this.currentShowGraph = 0;
            } else if (index == 1) {
                this.currentShowGraph = 1;
            }
        }

        this.getAutoTags = () => {
            const result = api.motionDetect(this.props.project.id)
            result.then(response => {
                this.addAutoTag(response.data.result)
            });
        }

        this.addAutoTag = (tags) => {
            const duration = this.player.getWrappedInstance().getDuration();
            tags.forEach(tag => {
                var tags_id = this.getRandom();

                this.setState({
                    figures: this.state.figures.map((figure, i) => {
                        if (i !== this.state.currentMovie) return figure;
                        figure.chapters.push({
                            id: null,
                            start_sec: tag.start_sec,
                            end_sec: tag.end_sec,
                            name: tag.name,
                            _destroy: false
                        });
                        figure.captions.push({
                            id: null,
                            start_sec: tag.start_sec,
                            end_sec: tag.end_sec,
                            text: tag.name,
                            _destroy: false
                        });
                        return figure;
                    })
                });

                this.tags.push({
                    id: tags_id,
                    tag: tag.name,
                    start_sec: tag.start_sec,
                    end_sec: tag.end_sec,
                    tags_num: this.state.figures[this.state.currentMovie].chapters.length - 1,
                })

                this.newTags.push({
                    id: tags_id,
                    tag: tag.name,
                    start_sec: tag.start_sec,
                    end_sec: tag.end_sec,
                    tags_num: this.state.figures[this.state.currentMovie].chapters.length - 1,
                })

                var listtag = [tag.start_sec * 570 / duration, tag.end_sec * 570 / duration]

                this.leftTagList.getWrappedInstance().appendTag(listtag, tag.name, tags_id)
                this.rightTagList.getWrappedInstance().appendTag(listtag, tag.name, tags_id)

            });

            this.leftTagList.getWrappedInstance().setState({ tags: this.tags })
            this.rightTagList.getWrappedInstance().setState({ tags: this.tags })

            this.closeModal()
        }

        this.sleep = msec => {
            var d1 = new Date();
            while (true) {
                var d2 = new Date();
                if (d2 - d1 > msec) {
                    break;
                }
            }
        }

        this.onSubmit = e => {
            e.preventDefault();
            const figures = this.state.figures.map(figure => {
                const captions = figure.captions.filter(caption => caption.text && !!caption.text.trim())
                const chapters = figure.chapters.filter(chapter => chapter.name && !!chapter.name.trim())
                figure.captions = captions;
                figure.chapters = chapters;
                return figure;
            })
            
            this.props.updateProject(
                Object.assign({}, this.props.project, {
                    name: this.props.project.name,
                    description: this.props.project.description,
                    private: this.props.project.private,
                    figures: figures
                })
            );

            api.createTrainData(this.props.project.sensor_infos, this.tags);

        };
    };

    handlePlayerTimeUpdate(time) {
        if (this.currentShowGraph == 0) {
            this.leftChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
            this.rightChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
        } else if (this.currentShowGraph == 1) {
            this.heartrateChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
        }
    }

    changeCurrentTime = (seconds) => {
        if (seconds != -1) {
            this.player.getWrappedInstance().changeCurrentTime(seconds);
        }
    }

    setBrushedRange = (brushedRange, brushedTime, brushedSec) => {
        this.brushedRange = brushedRange
        this.brushedTime = brushedTime
        this.brushedSec = brushedSec
    }

    createTag = () => {
        var tags_id = this.getRandom();

        this.setState({
            figures: this.state.figures.map((figure, i) => {
                if (i !== this.state.currentMovie) return figure;
                figure.chapters.push({
                    id: null,
                    start_sec: this.brushedSec[0],
                    end_sec: this.brushedSec[1],
                    name: this.refs.tagNameTxt.value,
                    _destroy: false
                });
                figure.captions.push({
                    id: null,
                    start_sec: this.brushedSec[0],
                    end_sec: this.brushedSec[1],
                    text: this.refs.tagNameTxt.value,
                    _destroy: false
                });
                return figure;
            })
        });

        this.tags.push({
            id: tags_id,
            name: this.refs.tagNameTxt.value,
            start_sec: this.brushedTime[0],
            end_sec: this.brushedTime[1],
            tags_num: this.state.figures[this.state.currentMovie].chapters.length - 1,
        })

        this.newTags.push({
            id: tags_id,
            name: this.refs.tagNameTxt.value,
            start_sec: this.brushedTime[0],
            end_sec: this.brushedTime[1],
            tags_num: this.state.figures[this.state.currentMovie].chapters.length - 1,
        })

        this.leftTagList.getWrappedInstance().setState({ tags: this.tags })
        this.rightTagList.getWrappedInstance().setState({ tags: this.tags })

        this.leftTagList.getWrappedInstance().appendTag(this.brushedRange, this.refs.tagNameTxt.value, tags_id)
        this.rightTagList.getWrappedInstance().appendTag(this.brushedRange, this.refs.tagNameTxt.value, tags_id)
    }

    removeTag = (id) => {

        const removeChapterId = this.tags.filter(tag => tag.id === id)[0].tags_num;

        const figures = this.state.figures.map((figure, i) => {
            if (i !== this.state.currentMovie) return figure;
            const chapters = figure.chapters.map((chapter, i) => {
                if (i === removeChapterId) chapter._destroy = true;
                return chapter;
            });
            const captions = figure.captions.map((caption, i) => {
                if (i === removeChapterId && caption.id === null) caption._destroy = true;
                return caption;
            });
            figure.chapters = chapters;
            figure.captions = captions;
            return figure;
        });

        const tags = this.tags.filter(tag => tag.tags_id !== id);
        const newTags = this.newTags.filter(tag => newTag.tags_id !== id);

        this.setState({
            figures: figures,
            tags: tags,
            newTags: newTags
        })

        this.leftTagList.getWrappedInstance().setState({ tags: this.tags })
        this.rightTagList.getWrappedInstance().setState({ tags: this.tags })
    }

    getRandom() {
        var random = 0;
        var hasNumber = true;
        while (hasNumber) {
            random = Math.floor(Math.random() * (65000 + 1));
            var filterTag = this.tags.filter(tag => tag.tags_id === random);
            var filterCaption = this.state.figures[0].captions.filter(caption => caption.id === random);
            if (filterTag.length <= 0 && filterCaption <= 0) hasNumber = false;
        }
        return random;
    }

    renderHeartRate() {
        return (
            <SensorGraph
                data='heartrate'
                changeCurrentTime={this.changeCurrentTime}
                setBrushedRange={this.setBrushedRange}
                ref={instance => { this.heartrateChart = instance; }} />
        );
    }

    initTags() {
        const duration = this.player.getWrappedInstance().getDuration();
        const chapters = this.props.project.content[0].figure.chapters;
        var tags = [];
        chapters.forEach((chapter, i) => {
            var tag = {
                "id": chapter.id,
                "name": chapter.name,
                "selection": [chapter.start_sec * 570 / duration, chapter.end_sec * 570 / duration],
                "tags_num": i
            }
            tags.push(tag);
        });
        this.setState({
            tags: tags
        });

        this.leftTagList.getWrappedInstance().renderTags(tags)
        this.rightTagList.getWrappedInstance().renderTags(tags)
    }

    render() {
        return (
            <div>
                <center>
                <Player
                    project={this.state.project}
                    isEditable={false}
                    handleThumbnailDeleteButtonClick={null}
                    handleThumbanailOrderChange={null}
                    handlePlayerTimeUpdate={this.handlePlayerTimeUpdate.bind(this)}
                    setDuration={this.initTags.bind(this)}
                    ref={instance => (this.player = instance)}
                />
                </center>
                <TaggingSensorGraph>
                    <Tabs onSelect={this.handleSensorGraphSelect} forceRenderTabPanel={true}>
                        <TabList>
                            <Tab>motion</Tab>
                            <Tab>heart</Tab>
                        </TabList>
                        <TabPanel>
                            <SensorGraphWrapper>
                                <TagListField>
                                    <TagList
                                        tagList={this.tags}
                                        removeTag={this.removeTag}
                                        ref={instance => { this.leftTagList = instance; }} />
                                    <TagList
                                        tagList={this.tags}
                                        removeTag={this.removeTag}
                                        ref={instance => { this.rightTagList = instance; }} />
                                </TagListField>
                                <SensorGraphField>
                                    <SensorGraph
                                        data='left'
                                        changeCurrentTime={this.changeCurrentTime}
                                        currentRoute="tagging"
                                        setBrushedRange={this.setBrushedRange}
                                        ref={instance => { this.leftChart = instance; }} />
                                    <SensorGraph
                                        data='right'
                                        changeCurrentTime={this.changeCurrentTime}
                                        currentRoute="tagging"
                                        setBrushedRange={this.setBrushedRange}
                                        ref={instance => { this.rightChart = instance; }} />
                                </SensorGraphField>
                            </SensorGraphWrapper>
                            <ItemsWrapper>
                                <Item>
                                    <input id="ax_checkbox" type="checkbox" defaultChecked={this.state.ax} onChange={this.onChartItemsChange} />
                                    <font color="#f28c36">加速度X</font>
                                </Item>
                                <Item className="item">
                                    <input id="ay_checkbox" type="checkbox" defaultChecked={this.state.ay} onChange={this.onChartItemsChange} />
                                    <font color="#e54520">加速度Y</font>
                                </Item>
                                <Item className="item">
                                    <input id="az_checkbox" type="checkbox" defaultChecked={this.state.az} onChange={this.onChartItemsChange} />
                                    <font color="#629ac9">加速度Z</font>
                                </Item>
                                <Item className="item">
                                    <input id="gx_checkbox" type="checkbox" defaultChecked={this.state.gx} onChange={this.onChartItemsChange} />
                                    <font color="#cfe43f">角速度X</font>
                                </Item>
                                <Item className="item">
                                    <input id="gy_checkbox" type="checkbox" defaultChecked={this.state.gy} onChange={this.onChartItemsChange} />
                                    <font color="#CCCC00">角速度Y</font>
                                </Item>
                                <Item className="item">
                                    <input id="gz_checkbox" type="checkbox" defaultChecked={this.state.gz} onChange={this.onChartItemsChange} />
                                    <font color="#8e37ca">角速度Z</font>
                                </Item>
                                <InputTextWrapper>
                                    テキスト: <input type="text" name="tag_name_txt" ref="tagNameTxt" />
                                </InputTextWrapper>
                                <CreateButton type="button" onClick={this.createTag}> 作成 </CreateButton>
                                <AutomaticTaggingButton type="button" onClick={this.openModal}> Automatic tagging </AutomaticTaggingButton>
                            </ItemsWrapper>

                        </TabPanel>
                        <TabPanel>
                            <SensorGraph
                                data='heartrate'
                                changeCurrentTime={this.changeCurrentTime}
                                currentRoute="tagging"
                                setBrushedRange={this.setBrushedRange}
                                ref={instance => { this.heartrateChart = instance; }} />
                        </TabPanel>
                    </Tabs>
                </TaggingSensorGraph>

                <SaveButton type="submit" onClick={this.onSubmit}>save</SaveButton>

                <ReactModal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}
                    style={modalStyles}
                    contentLabel="Example Modal"
                >

                    <h2>Do you want to add tags automatically?</h2>
                    <ModalButtonWrapper>
                        <ModalButtonOK onClick={this.getAutoTags}>Yes</ModalButtonOK>
                        <ModalButtonNO onClick={this.closeModal}>No</ModalButtonNO>
                    </ModalButtonWrapper>
                </ReactModal>
            </div>
        );
    }

    componentWillReceiveProps(props) {
        if (props.project !== null) {
            this.setState({
                figures: props.project.content.map(content => content.figure),
            });
        }
    }
}

ProjectSensorTagging.propTypes = {
    project: PropTypes.object,
    updateProject: PropTypes.func
};

const mapStateToProps = (state) => (
    {
        project: state.player.project,
    }
);

export const mapDispatchToProps = dispatch => ({
    updateProject: project => dispatch(updateProject(project))
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectSensorTagging);