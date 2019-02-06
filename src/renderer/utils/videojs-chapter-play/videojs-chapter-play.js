import videojs from 'video.js';
import './videojs-chapter-play.scss';

// Default options for the plugin.
const defaults = {
    beforeElement: 'fullscreenToggle',
    textControl: 'Chapter Play',
    name: 'chapterPlayButton'
};

const vjsButton = videojs.getComponent('Button');

class ChapterPlayButton extends vjsButton {
    constructor(player, options) {
        super(player, options);
        this.isChapterPlaying = false;
        this.cue = [];

        player.on('loadeddata', () => {
            this.cues = [];
            console.log(player.textTracks().tracks_)
            if (player.textTracks().tracks_[2].cues_.length > 0) {
                this.cues = player.textTracks().tracks_[2].cues_;
                this.cues.sort((a, b) => a.startTime - b.startTime);
            }
        })

        player.on('timeupdate', () => {
            if (this.isChapterPlaying) {
                var endCurrentChapter = this.cues.some((cue) => {
                    if (player.currentTime() > cue.startTime - 2 && player.currentTime() < cue.endTime) return true
                    else return false;
                })
                if(!endCurrentChapter) player.markers.next();
            } 
        });
    }

    /**
    * Allow sub components to stack CSS class names
    *
    * @return {String} The constructed class name
    * @method buildCSSClass
    */
    buildCSSClass() {
        return `vjs-chapter-play ${super.buildCSSClass()}`;
    }

    /**
    * Handles click for chapter play
    *
    * @method handleClick
    */
    handleClick(e) {
        e.stopPropagation();
        this.isChapterPlaying = !this.isChapterPlaying;
        if(e.target.getAttribute('working') === 'true') {
            e.target.setAttribute('working', 'false');
        } else {
            e.target.setAttribute('working', 'true');
        }
    }
}

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 * @param    {Object} [options={}]
 */
const onPlayerReady = (player, options) => {
    const chapterPlayButton = player.controlBar.addChild(new ChapterPlayButton(player, options), {});
    chapterPlayButton.controlText(options.textControl);

    player.controlBar.el().insertBefore(
        chapterPlayButton.el(),
        player.controlBar.getChild(options.beforeElement).el()
    );

    player.addClass('vjs-chapter-play');
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function vjsdownload
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const vjsChapterPlay = function(options) {
    this.ready(() => {
        onPlayerReady(this, videojs.mergeOptions(defaults, options));
    });
};

// Register the plugin with video.js.
videojs.registerPlugin('vjs-chapter-play', vjsChapterPlay);

export default vjsChapterPlay;
