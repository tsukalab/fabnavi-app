import React from 'react';
import PropTypes from 'prop-types';

import TextTrackField from './TextTrackField';

import {
    EditBanner,
    StyledTextTracksField,
    TextTrackFieldSpan,
    StyledTextTrackFieldHeader,
    TextTrackFieldWrapper,
    TextTrackFieldIndex,
    TextTrackFieldList,
    AddTextTrackButton
} from '../../stylesheets/application/ProjectEditForm/TextTracksField';

const TextTracksField = ({ kind, figures, contentType, handleTextTracksChange, onAddTextTrackButtonClick }) => {
    return (
        <StyledTextTracksField>
            <EditBanner className="edit"> {kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase()} </EditBanner>
            <StyledTextTrackFieldHeader>
                <TextTrackFieldSpan text="start" contentType={contentType}>start(h:m:s)</TextTrackFieldSpan>
                <TextTrackFieldSpan text="end" contentType={contentType}>end(h:m:s)</TextTrackFieldSpan>
                <TextTrackFieldSpan text="text" contentType={contentType}>{kind}</TextTrackFieldSpan>
                <TextTrackFieldSpan>delete</TextTrackFieldSpan>
            </StyledTextTrackFieldHeader>
            {figures.map((figure, figureIndex) => {
                return (
                    <TextTrackFieldWrapper
                        key={`figure_${figure.id}_${kind}s`}
                        figureWillBeDeleted={figure._destroy}
                    >
                        <TextTrackFieldIndex> {`${contentType}#${figureIndex + 1}`}</TextTrackFieldIndex>
                        <TextTrackFieldList>
                            {kind === "caption" ? figure.captions.map((caption, index) => {
                                return (
                                    <TextTrackField
                                        kind = {kind}
                                        textTrack={caption}
                                        index={index}
                                        figureIndex={figureIndex}
                                        contentType={contentType}
                                        handleTextTracksChange={handleTextTracksChange}
                                        key={`${kind}_${figureIndex}_${index}`}
                                    />
                                );
                            }) : kind === "chapter" ? figure.chapters.map((chapter, index) => {
                                return (
                                    <TextTrackField
                                        kind = {kind}
                                        textTrack={chapter}
                                        index={index}
                                        figureIndex={figureIndex}
                                        contentType={contentType}
                                        handleTextTracksChange={handleTextTracksChange}
                                        key={`${kind}_${figureIndex}_${index}`}
                                    />
                                );
                            })
                        : null}
                        </TextTrackFieldList>
                        <AddTextTrackButton
                            className="addTextTrackButton"
                            onClick={onAddTextTrackButtonClick}
                            data-index={figureIndex}
                            data-kind={kind}
                        >
                            add {kind}
                        </AddTextTrackButton>
                    </TextTrackFieldWrapper>
                );
            })}
        </StyledTextTracksField>
    );
};

TextTracksField.propTypes = {
    kind: PropTypes.string,
    figures: PropTypes.array,
    contentType: PropTypes.string,
    handleTextTracksChange: PropTypes.func,
    onAddTextTrackButtonClick: PropTypes.func
};

export default TextTracksField;
