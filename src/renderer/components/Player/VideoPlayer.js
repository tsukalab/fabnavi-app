import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Debug from 'debug';
import videojs from 'video.js';
import 'videojs-playlist';
import 'videojs-markers';
import 'videojs-markers/dist/videojs.markers.css';
import '../../utils/videojs-summary-play/videojs-summary-play'
import '../../utils/videojs-chapter-play/videojs-chapter-play'

import { VideoPanel, ImageType } from '../../stylesheets/player/Player';
import { buildCaptions, buildFigureUrl, buildChapters } from '../../utils/playerUtils'

const debug = Debug('fabnavi:jsx:VideoPlayer');

export class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isPlaying: false,
            index: this.props.index,
            isInit: false
        };
        this.handleClick = e => {
            const video = document.querySelector('video');
            if(this.state.isPlaying) {
                video.pause();
            } else {
                video.play();
            }
            this.setState({ isPlaying: !this.state.isPlaying });
            return;
        };
    }

    updatePlaylist(project, index = 0) {
        this.player.playlist([]);
        setTimeout(() => {
            const figures = project.content
                .filter(content => content.figure && !content.figure._destroy)
                .map(content => content.figure)
                .sort((fig1, fig2) => fig1.position - fig2.position);
            const buildPlaylistOption = figure => {
                return {
                    sources: [
                        {
                            src: buildFigureUrl(figure.file.url),
                            type: 'video/mp4'
                        }
                    ],
                    poster: buildFigureUrl(figure.file.thumb.url),
                    textTracks: [
                        buildCaptions(figure.captions.filter(caption => caption._destroy !== true)),
                        null,
                        buildChapters(figure.chapters.filter(chapter => chapter._destroy !== true).sort((chap1,chap2) => chap1.start_sec - chap2.start_sec))
                    ]
                }
            };
            const playlistOptions = figures.map(figure => buildPlaylistOption(figure));
            this.player.playlist(playlistOptions);
            const currentMinus5Sec = this.player.currentTime() - 5 || 0;
            setTimeout(() => {
                this.player.playlist.currentItem(index);
                this.updateChapterMarkers(figures[this.player.playlist.currentIndex()]);
                setTimeout(() => this.player.currentTime(currentMinus5Sec), 0);
            }, 0);
        });
    }

    updateChapterMarkers(figure) {
        if(!figure) return;
        const markers = figure.chapters.filter(chapter => chapter._destroy !== true).map(chapter => {
            return {
                time: chapter.start_sec,
                text: chapter.name,
                overlayText: chapter.name,
            }
        });
        if(!this.state.isInit) {
            this.player.markers({    
                breakOverlay:{
                display: true,
                displayTime: 3,
                style:{
                   'width':'100%',
                   'height': '10%',
                   'background-color': 'rgba(0,0,0,0.7)',
                   'color': 'white',
                   'font-size': '20px'
                },
                text: function(marker) {
                   return marker.overlayText;
                }
             },
                markers: markers });
            this.state.isInit = true
        }
        else {
            this.player.markers.reset(markers);
            
        }
    }

    getCurrentTime() {
        return this.player.currentTime();
    }

    getDuration() {
        return this.player.duration();
    }

    changeCurrentTime(seconds){
        this.player.currentTime(seconds)
    }

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, {
            plugins: {
                'vjs-summary-play': {},
                'vjs-chapter-play': {}
            }
        });
        this.updatePlaylist(this.props.project);
        this.player.playlist.autoadvance(0);
        this.player.on('play', () => {
            this.props.videoChanged(this.player.playlist.currentIndex());
            this.setState({ index: this.player.playlist.currentIndex() });
        });
        if (this.props.handlePlayerTimeUpdate != null) {
            this.player.on('timeupdate', () => {
                this.props.handlePlayerTimeUpdate(this.getCurrentTime())
            });
        }
        this.player.on('loadedmetadata', () => {
            if(this.props.setDuration() !== null){
                this.props.setDuration();
            }
        });
    }

    // destroy player on unmount
    componentWillUnmount() {
        if(this.player) {
            this.player.dispose();
        }
    }

    componentWillReceiveProps(nextProps) {
        if(this.props.index !== nextProps.index) {
            this.player.playlist.currentItem(nextProps.index);
            this.player.markers({markers: []});
            this.updateChapterMarkers(this.props.project.content.filter(content => content.figure).map(content => content.figure)[nextProps.index]);
        } else if(nextProps.project) {
            this.updatePlaylist(nextProps.project, this.player.playlist.currentIndex());
        }
    }
    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856
    render() {
        const dataSetup =
            this.props.size === 'small' ?
                '{ "playbackRates": [0.5, 1, 1.5, 2, 4, 8, 16, 32], "width": 544, "height": 306 }' :
                '{ "playbackRates": [0.5, 1, 1.5, 2, 4, 8, 16, 32], "width": 1040, "height": 585 }';
        return (
            <div>
                {this.props.isEditable && <ImageType>Preview</ImageType>}
                <div
                    onClick={this.handleClick}
                    onContextMenu={this.handleClick}
                    style={{ display: 'table-cell' }}
                    data-update={this.props.toggleUpdate}
                >
                    <div data-vjs-player>
                        <VideoPanel
                            innerRef={node => (this.videoNode = node)}
                            data-setup={dataSetup}
                            id="video"
                            className="video-js  vjs-default-skin vjs-big-play-centered"
                            controls={true}
                            preload="auto"
                            style={this.props.size !== 'small' ? { marginTop: '33px' } : null}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export const mapStateToProps = state => ({
    project: state.player.project
});

VideoPlayer.propTypes = {
    project: PropTypes.object,
    index: PropTypes.number,
    figures: PropTypes.array,
    toggleUpdate: PropTypes.bool,
    isEditable:PropTypes.bool,
    size: PropTypes.string,
    videoChanged: PropTypes.func,
    setDuration: PropTypes.func,
    handlePlayerTimeUpdate: PropTypes.func,
};

export default connect(
    mapStateToProps,
    null,
    null,
    { withRef: true }
)(VideoPlayer);
