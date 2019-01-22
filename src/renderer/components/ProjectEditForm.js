import React from 'react';
import PropTypes from 'prop-types';
import Debug from 'debug';

import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import { debounce } from 'throttle-debounce';

import { updateProject } from '../actions/manager';

import Player from './Player';
import TextTracksField from './ProjectEditForm/TextTracksField';

import { EditPage, PageTitle, EditTextTrack, InputTitle, InputPrivate, DescriptionFieldWrapper, DescriptionField, SaveButton, EditTarget } from '../stylesheets/application/ProjectEditForm';
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
            chapters: []
        };
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
                                    ref={instance => (this.player = instance)}
                                />
                                <Tabs>
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
