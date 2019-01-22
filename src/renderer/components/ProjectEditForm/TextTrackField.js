import React from 'react';
import PropTypes from 'prop-types';
import { secondsToHHMMSS } from '../../utils/playerUtils';

import {
    StyledTextTrackField,
    InputID,
    InputText,
    InputTime,
    InputDestroy,
} from '../../stylesheets/application/ProjectEditForm/TextTrackField';

const TextTrackField = ({ kind, textTrack, index, figureIndex, contentType, handleTextTracksChange }) => {
    return (
        <StyledTextTrackField
            onChange={handleTextTracksChange}
            data-figure-index={figureIndex}
            data-index={index}
            willBeRemoved={!!textTrack._destroy}
        >
            <InputID  name="id" data-index={index} data-kind={kind} defaultValue={textTrack.id || null} />
            <InputTime
                name="start_sec"
                step="1"
                min="00:00:00"
                max="00:59:59"
                data-index={index}
                data-kind={kind}
                defaultValue={secondsToHHMMSS(textTrack.start_sec)}
                contentType={contentType}
            />
            <InputTime
                name="end_sec"
                step="1"
                min="00:00:00"
                max="00:59:59"
                data-index={index}
                data-kind={kind}
                defaultValue={secondsToHHMMSS(textTrack.end_sec)}
                contentType={contentType}
            />
            <InputText name={"text"} data-index={index} data-kind={kind} defaultValue={kind === "caption" ? textTrack.text : textTrack.name} />
            <InputDestroy name="_destroy" data-index={index} data-kind={kind} defaultChecked={false} />
        </StyledTextTrackField>
    );
};

TextTrackField.propTypes = {
    kind: PropTypes.string,
    textTrack: PropTypes.object,
    index: PropTypes.number,
    figureIndex: PropTypes.number,
    contentType: PropTypes.string,
    handleTextTracksChange: PropTypes.func
};

export default TextTrackField;
