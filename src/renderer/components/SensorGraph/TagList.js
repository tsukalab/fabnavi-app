import React from 'react';
import PropTypes from 'prop-types';
import Debug from 'debug';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import * as d3 from "d3";


const debug = Debug('fabnavi:jsx:TagList');

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

class TagList extends React.Component {

  constructor(props) {
    super(props);
    // 表示サイズを設定
    this.margin = {
      top: 20,
      right: 40,
      bottom: 0,
      left: 40
    };

    this.size = {
      width: 650,
      height: 50
    };

    this.width = this.size.width - this.margin.left - this.margin.right;
    this.height = this.size.height - this.margin.top - this.margin.bottom;

    this.state = {
      svg: null,
      figures: [],
      tags: [],
      modalIsOpen: false,
      selectTag: null,
    }

    this.openModal = () => {
      this.setState({ modalIsOpen: true });
    }

    this.closeModal = () => {
      this.setState({ modalIsOpen: false });
    }
  }

  onRef = (ref) => {
    this.setState({
      svg:
        d3.select(ref)
          .attr("width", this.size.width)
          .attr("height", this.size.height)
          .append("g")
          .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
    })
  }

  renderTags = (tags) => {

    this.state.tags = tags

    tags.forEach(tag => {
      this.appendTag(tag.selection, tag.tag, tag.id)
    });
  }

  appendTag(selection, tag, id) {

    this.state.svg.append("rect")
      .on("click", () => {
        this.openModal();
        this.setState({ selectTag: id })
      })
      .classed("tag" + id, true)
      .attr("x", selection[0])
      .attr("y", 25)
      .attr("width", selection[1] - selection[0])
      .attr("height", 25)
      .attr("fill", this.colorGen(tag))

    var textsize = 13

    this.state.svg.append("text") // 楕円を追加。以後のメソッドは、この楕円に対しての設定になる<br>
      .classed("tag" + id, true)
      .attr("x", selection[0])  // x座標を指定<br>
      .attr("y", 10) // y座標を指定<br>
      .attr("font-size", textsize)
      .text(tag)
  }

  modalYesAction = () => {
    this.props.removeTag(this.state.selectTag)
    this.remove(this.state.selectTag)
    this.closeModal()
  }

  remove = (id) => {
    d3.selectAll('.tag' + id).remove()
  }

  colorGen(tag) {

    if (tag.indexOf('はさみ') != -1 || tag.indexOf('scissors') != -1) {
      return "#F6A336"
    } else if (tag.indexOf('金槌') != -1 || tag.indexOf('hammer') != -1) {
      return "#008000"
    }
    else if (tag.indexOf('組立') != -1 || tag.indexOf('hammer') != -1) {
      return "#00bfff"
    }else if (tag.indexOf('ワイヤー') != -1) {
      return "#0000d2"
    }else if (tag.indexOf('スパナ') != -1) {
      return "#F0E68C"
    }else if (tag.indexOf('六角') != -1) {
      return "#8C19E4"
    }else if (tag.indexOf('彫刻刀') != -1) {
      return "#E21A2B"
    }else if(tag.indexOf('ニッパー') != -1){
      return "#6DF60B"
    }else if(tag.indexOf('ドライバー') != -1){
      return "#39EEF4"
    }
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  render() {
    return (
      <div>
        <svg ref={this.onRef}></svg>

      {this.props.removeTag !== null ?
      <ReactModal
        isOpen={this.state.modalIsOpen}
        onRequestClose={this.closeModal}
        style={modalStyles}
        contentLabel="Example Modal"
      >

        <h2>Do you want to remove tag?</h2>
        <div align="right" >
          <button onClick={this.modalYesAction}>Yes</button>
          <button className="no-button" onClick={this.closeModal}>No</button>
        </div>
      </ReactModal>
    : null}
      </div>
    );
  }
}

TagList.propTypes = {
  tagList: PropTypes.array,
  removeTag: PropTypes.func,
};

export default connect(
  null,
  null,
  null,
  { withRef: true }
)(TagList);