import styled, { css } from 'styled-components';

export const ProjectFrame = styled.div`
    margin: 10px 20px 20px;
    position: relative;
    width: 220px;
    height: 360.85px;
    transition: 0.1s ease-in-out;

    &:hover {
        box-shadow: 0 0 0 3px #ff0000;
        border-radius: 8px 8px 8px 8px;
    }

    ${props =>
        props.selected ?
            css`
                  box-shadow: 0 0 0 3px #ff0000;
                  border-radius: 7px 7px 7px 7px;
              ` :
            css`
                  box-shadow: 6px 6px 2px #ddd;
                  border-radius: 7px 7px 7px 7px;
              `};
`;

export const InsideFrame = styled.div`
    display: flex;
    flex-direction: column;
`;

export const ProjectThumb = styled.div`
    width: 220px;
    height: 165px;
    margin: 0 auto;
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        border-radius: 8px 8px 0 0;
    }
`;

export const ProjectTitle = styled.p`
    width: 196px;
    height: 23px;
    font-family: 'YuGothic-Bold';
    margin: 0px;
    padding: 0px;
    font-size: 18px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-top: 13px;
    margin-left: 10px;
    margin-bottom: -5px;
`;

export const ProjectDescription = styled.p`
    font-family: 'YuGothic-Medium';
    font-size: 14px;
    width: 196px;
    height: 81px;
    color: #000000;
    word-break: break-all;
    margin: 0px;
    margin-top: 15px;
    margin-left: 10px;
`;
export const StatusFrame = styled.div`
    display: flex;
    flex-direction: row;
`;
export const ProjectUser = styled.img`
    width: 36px;
    height: 36px;
    margin-left: 10px;
    ${props =>
        props.user ?
            css`
                  border-radius: 100%;
                  margin-top: 5px;
              ` :
            css`
                  margin-left: 10px;
              `};
`;

export const UserStatusFrame = styled.div`
    display: flex;
    flex-direction: column;
    width: 93px;
    height: 30px;
    margin-top: 5px;
    margin-left: 12px;
`;

export const UserName = styled.p`
    font-family: 'YuGothic-Medium';
    font-size: 12px;
    color: #555555;
    margin: 0px;
`;

export const ProjectDate = styled.p`
    font-family: 'YuGothic-Medium';
    font-size: 12px;
    color: #555555;
    margin: 0px;
    margin-top: 5px;
`;

export const ProjectMenu = styled.div`
    position: absolute;
    width: 220px;
    top: 0;
`;

export const MenuColmun = styled.div`
    background-color: rgba(125, 125, 125, 0.5);
    &:hover {
        background-color: rgba(60, 60, 60, 0.5);
    }
    &:first-child {
        border-radius: 7px 7px 0 0;
    }
`;
