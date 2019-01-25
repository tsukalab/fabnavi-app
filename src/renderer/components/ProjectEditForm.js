import React from 'react';
import PropTypes from 'prop-types';
import Debug from 'debug';

import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import { debounce } from 'throttle-debounce';

import { updateProject } from '../actions/manager';
import SensorGraph from './SensorGraph/SensorGraph';
import TagList from './SensorGraph/TagList';

import Player from './Player';
import TextTracksField from './ProjectEditForm/TextTracksField';

import { EditPage, PageTitle, EditTextTrack, InputTitle, InputPrivate, DescriptionFieldWrapper, DescriptionField, SaveButton, EditTarget } from '../stylesheets/application/ProjectEditForm';
import { TagListField, SensorGraphField, SensorGraphWrapper, ItemsWrapper, Item, CreateButton, EditSensorGraph, InputTextWrapper, InputText } from '../stylesheets/sensor/SensorGraph';
import { EditBanner } from '../stylesheets/application/ProjectEditForm/TextTracksField';

const debug = Debug('fabnavi:jsx:ProjectEditForm');

export class ProjectEditForm extends React.Component {
    constructor(props) {
        super(props);

        this.onSubmit = e => {
            e.preventDefault();
            const figures = this.state.figures.map(figure => {
                const captions = figure.captions.filter(caption => caption.text && !!caption.text.trim())
                figure.captions = captions;
                const chapters = figure.chapters.filter(chapter => chapter.name && !!chapter.name.trim())
                figure.chapters = chapters;
                return figure;
            })
            this.props.updateProject(
                Object.assign({}, this.props.project, {
                    name: this.state.name,
                    description: this.state.description,
                    private: this.state.private,
                    figures: figures
                })
            );
        };

        this.handleNameChange = e => {
            this.setState({ name: e.target.value });
        };

        this.handlePublishStatusChange = e => {
            this.setState({ private: e.target.value });
        };

        this.handleDescriptionChange = e => {
            this.setState({ description: e.target.value });
        };

        this.changeTextTracks = debounce(500, this.changeTextTracks);

        this.onAddTextTrackButtonClick = e => {
            e.preventDefault();
            const index = parseInt(e.target.dataset.index, 10);
            if(!this.state.figures) return;
            const currentTime = this.player.getWrappedInstance().getCurrentTime();
            this.setState({
                figures: this.state.figures
                    .sort((a, b) => a.position - b.position)
                    .map((figure, i) => {
                        if (i !== index) return figure;
                        if (e.target.dataset.kind === 'caption') {
                            figure.captions.push({
                                id: null,
                                start_sec: currentTime,
                                end_sec: currentTime,
                                text: ''
                            });
                        } else if (e.target.dataset.kind === 'chapter') {
                            figure.chapters.push({
                                id: null,
                                start_sec: currentTime,
                                end_sec: currentTime,
                                name: ''
                            });
                        }
                        return figure;
                    })
            });
        };

        this.onAddTextTrackButtonClickFromSensor = e => {
            e.preventDefault();
            const index = this.player.getWrappedInstance().getIndex();
            if(!this.state.figures) return;
            const currentTime = this.player.getWrappedInstance().getCurrentTime();
            this.setState({
                figures: this.state.figures
                    .sort((a, b) => a.position - b.position)
                    .map((figure, i) => {
                        if (i !== index) return figure;
                        if (this.currentTextTrack === 0) {
                            figure.captions.push({
                                id: null,
                                start_sec: this.brushedRange[0],
                                end_sec: this.brushedRange[1],
                                text: this.refs.tagNameTxt.value
                            });
                        } else if (this.currentTextTrack === 1) {
                            figure.chapters.push({
                                id: null,
                                start_sec: this.brushedRange[0],
                                end_sec: this.brushedRange[1],
                                name: this.refs.tagNameTxt.value
                            });
                        }
                        return figure;
                    })
            });
        };
    

        this.updatePlayer = figures => {
            const content = this.state.project.content.map((cont, i) => {
                cont.figure = figures[i];
                return cont;
            });
            const project = Object.assign({}, this.props.project, {
                content: content
            });
            this.setState({ project: project });
        };

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
        };

        this.currentShowGraph = 0;
        this.currentTextTrack = 0;
        this.brushedRange = null;
    }

    handlerTextTracksChange(e) {
        this.changeTextTracks(e.nativeEvent);
    }

    changeTextTracks(e) {
        const li = e.target.parentNode;
        const figureIndex = parseInt(li.dataset.figureIndex, 10);
        const textTrackIndex = parseInt(li.dataset.index, 10);
        const name = e.target.name;
        const figures = this.state.figures.map((figure, i) => {
            if (i !== figureIndex) return figure;
            if (e.target.dataset.kind === 'caption') {
                const caption = figure.captions[textTrackIndex];
                if (name === 'text') {
                    caption[name] = e.target.value;
                } else if (name === '_destroy') {
                    caption[name] = e.target.checked;
                } else {
                    caption[name] = isNaN(e.target.valueAsNumber) ? 0 : parseInt(e.target.valueAsNumber, 10) / 1000;
                }
            } else if (e.target.dataset.kind === 'chapter') {
                const chapter = figure.chapters[textTrackIndex];
                if (name === 'text') {
                    chapter['name'] = e.target.value;
                } else if (name === '_destroy') {
                    chapter[name] = e.target.checked;
                } else {
                    chapter[name] = isNaN(e.target.valueAsNumber) ? 0 : parseInt(e.target.valueAsNumber, 10) / 1000;
                }
            }
            return figure;
        });
        this.setState({ figures: figures });
        this.updatePlayer(figures);
    }

    handleThumbnailDeleteButtonClick(e) {
        e.stopPropagation();
        this.changeFigureState(e.nativeEvent);
    }

    handleThumbanailOrderChange(figures) {
        const content = this.props.project.content.map((cont, i) => {
            cont.figure = figures[i];
            return cont;
        });

        const project = Object.assign({}, this.state.project, {
            content: content
        });

        this.setState({
            project: project,
            figures: figures
        })
    }

    changeFigureState(e) {
        const thumbnail = e.target.parentNode;
        const figureIndex = parseInt(thumbnail.dataset.index, 10);
        const figures = this.state.figures.map((figure, i) => {
            if(i !== figureIndex) return figure;
            figure._destroy = !figure._destroy;
            return figure;
        });
        this.setState({ figures: figures });
    }

    handlePlayerTimeUpdate(time){
        if (this.currentShowGraph == 0) {
            this.leftChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
            this.rightChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
        } else if (this.currentShowGraph == 1) {
            this.heartrateChart.getWrappedInstance().moveTimeBar(time, this.player.getWrappedInstance().getDuration())
        }
    }

    handleSensorGraphSelect = index => {
        if (index == 0) {
            this.currentShowGraph = 0;
        } else if (index == 1) {
            this.currentShowGraph = 1;
        }
    }

    handleTextTrackSelect = index => {
        if (index == 0) {
            this.currentTextTrack = 0;
        } else if (index == 1) {
            this.currentTextTrack = 1;
        }
    }

    changeCurrentTime = (seconds) => {
        if (seconds != -1) {
            this.player.getWrappedInstance().changeCurrentTime(seconds);
        }
    }

    onChartItemsChange = e => {
        if (e.target.checked) {
            this.leftChart.getWrappedInstance().addItem(e.target.id.slice(0, 2))
            this.rightChart.getWrappedInstance().addItem(e.target.id.slice(0, 2))
        } else {
            this.leftChart.getWrappedInstance().removeItem(e.target.id.slice(0, 2))
            this.rightChart.getWrappedInstance().removeItem(e.target.id.slice(0, 2))
        }
    }

    setBrushedRange = (brushedRange) => {
        this.brushedRange = brushedRange;
        console.log(this.brushedRange)
    }

    componentWillReceiveProps(props) {
        if(props.project !== null) {
            this.setState({
                name: props.project.name,
                description: props.project.description,
                private: props.project.private,
                figures: props.project.content
                    .map(content => {
                        const figure = content.figure;
                        figure.captions = figure.captions.sort((a, b) => (a.start_sec - b.start_sec));
                        return figure;
                    })
                    .sort((a, b) => a.position - b.position),
                captions: props.project.content[0].figure.captions.sort((a, b) => (a.start_sec - b.start_sec)),
                chapters: props.project.content[0].figure.chapters.sort((a, b) => (a.start_sec - b.start_sec))
            });
        }
    }

    render() {
        const project = this.props.project;
        return (
            <div>
                <EditPage>
                    <PageTitle>Project Editor</PageTitle>
                    {project && project.content ? (
                        <form onSubmit={this.onSubmit}>
                            <div>
                                <EditTarget>Project Name</EditTarget>
                                <InputTitle
                                    onChange={this.handleNameChange}
                                    value={this.state.name}
                                    type="text"
                                />
                            </div>

                            <div>
                                <EditTarget>Privacy Settings</EditTarget>
                                <div>
                                    <InputPrivate
                                        onChange={this.handlePublishStatusChange}
                                        type="radio"
                                        value={true}
                                        name="private"
                                        defaultChecked={project.private}
                                    />
                                    <label>This project is <span style={{ textDecoration: 'underline' }}>Private</span>. Only you can see this project.</label>
                                </div>
                                <div>
                                    <InputPrivate
                                        onChange={this.handlePublishStatusChange}
                                        type="radio"
                                        value={false}
                                        name="private"
                                        defaultChecked={!project.private}
                                    />
                                    <label>This project is <span style={{ textDecoration: 'underline' }}>Public</span>. Anyone can see this project.</label>
                                </div>
                            </div>

                            <EditTextTrack>
                                <Player
                                    project={this.state.project}
                                    size="small"
                                    isEditable={true}
                                    handleThumbnailDeleteButtonClick={this.handleThumbnailDeleteButtonClick.bind(this)}
                                    handleThumbanailOrderChange={this.handleThumbanailOrderChange.bind(this)}
                                    handlePlayerTimeUpdate={this.handlePlayerTimeUpdate.bind(this)}
                                    ref={instance => (this.player = instance)}
                                />
                                <Tabs onSelect={this.handleTextTrackSelect}>
                                    <TabList>
                                        <Tab><EditBanner>Caption</EditBanner></Tab>
                                        <Tab><EditBanner>Chapter</EditBanner></Tab>
                                    </TabList>

                                    <TabPanel>
                                        <TextTracksField
                                            kind={"caption"}
                                            figures={this.state.figures}
                                            contentType={project.content[0].type === 'Figure::Frame' ? 'movie' : 'photo'}
                                            handleTextTracksChange={this.handlerTextTracksChange.bind(this)}
                                            onAddTextTrackButtonClick={this.onAddTextTrackButtonClick}
                                        />
                                    </TabPanel>
                                    <TabPanel>
                                        <TextTracksField
                                            kind={"chapter"}
                                            figures={this.state.figures}
                                            contentType={project.content[0].type === 'Figure::Frame' ? 'movie' : 'photo'}
                                            handleTextTracksChange={this.handlerTextTracksChange.bind(this)}
                                            onAddTextTrackButtonClick={this.onAddTextTrackButtonClick}
                                        />
                                    </TabPanel>
                                </Tabs>
                            </EditTextTrack>

                            <EditSensorGraph>
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
                                                        currentRoute="edit"
                                                        setBrushedRange={this.setBrushedRange}
                                                        ref={instance => { this.leftChart = instance; }} />
                                                    <SensorGraph
                                                        data='right'
                                                        changeCurrentTime={this.changeCurrentTime}
                                                        currentRoute="edit"
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
                                                <CreateButton type="button" onClick={this.onAddTextTrackButtonClickFromSensor}> 作成 </CreateButton>
                                            </ItemsWrapper>
                                        
                                    </TabPanel>
                                    <TabPanel>
                                            <SensorGraph
                                                data='heartrate'
                                                changeCurrentTime={this.changeCurrentTime}
                                                currentRoute="edit"
                                                setBrushedRange={this.setBrushedRange}
                                                ref={instance => { this.heartrateChart = instance; }} />
                                    </TabPanel>
                                </Tabs>
                                </EditSensorGraph>

                            <DescriptionFieldWrapper>
                                <EditTarget>Description</EditTarget>
                                <DescriptionField
                                    onChange={this.handleDescriptionChange}
                                    value={this.state.description}
                                    rows="10"
                                />
                            </DescriptionFieldWrapper>
                            <SaveButton type="submit" onClick={this.onSubmit}>save</SaveButton>
                        </form>
                    ) : (
                        <div> loading project... </div>
                    )}
                </EditPage>
            </div>
        );
    }
}

ProjectEditForm.propTypes = {
    project: PropTypes.object,
    updateProject: PropTypes.func
};

export const mapStateToProps = state => ({
    project: state.manager.targetProject
});

export const mapDispatchToProps = dispatch => ({
    updateProject: project => dispatch(updateProject(project))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectEditForm);
