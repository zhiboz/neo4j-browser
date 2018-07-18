/*
 * Copyright (c) 2002-2020 "Neo4j,"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react'
import { deepEquals } from 'services/utils'
import {
  createGraph,
  getGraphStats,
  mapNodes,
  mapRelationships
} from '../mapper'
import { GraphEventHandler } from '../GraphEventHandler'
import '../lib/visualization/index'
import { dim } from 'browser-styles/constants'
import {
  StyledEditButton,
  StyledEditHolder,
  StyledSvgWrapper,
  StyledZoomButton,
  StyledZoomHolder
} from './styled'
import {
  AddItemIcon,
  ConnectItemIcon,
  EditItemIcon,
  TrashItemIcon,
  ZoomInIcon,
  ZoomOutIcon
} from 'browser-components/icons/Icons'
import {
  StyledConnectButton,
  StyledEditFormHolder
} from 'src-root/browser/modules/D3Visualization/components/styled'
import { StyledDrawer } from 'src-root/browser/components/TabNavigation/styled'
import { FormButton } from 'src-root/browser/components/buttons'
import {
  Drawer,
  DrawerBody,
  DrawerSection,
  DrawerSectionBody,
  DrawerSubHeader
} from 'src-root/browser/components/drawer'
import graphView from '../lib/visualization/components/graphView'

export class GraphComponent extends Component {
  constructor (props) {
    super(props)
    this.state = {
      zoomInLimitReached: true,
      zoomOutLimitReached: false,
      connectionSourceItem: null
    }
  }

  graphInit(el) {
    this.svgElement = el
  }

  zoomInClicked(el) {
    const limits = this.graphView.zoomIn(el)
    this.setState({
      zoomInLimitReached: limits.zoomInLimit,
      zoomOutLimitReached: limits.zoomOutLimit
    })
  }

  zoomOutClicked(el) {
    const limits = this.graphView.zoomOut(el)
    this.setState({
      zoomInLimitReached: limits.zoomInLimit,
      zoomOutLimitReached: limits.zoomOutLimit
    })
  }

  trashItemClicked () {
    const item = this.props.selectedItem

    this.props.deleteItem(item).then(item => {
      if (item.type === 'relationship') {
        const relationship = this.graph.findRelationship(item.item.id)
        this.graph.removeRelationship(relationship)
        this.graphEH.propagateChange()
      } else {
        this.graphEH.nodeClose(item)
      }
    })
  }

  editItemClicked () {
    const item = this.props.selectedItem
    console.log('TODO: Edit ', item)
  }

  connectItemClicked () {
    const targetItem = this.props.selectedItem

    if (!this.state.connectionSourceItem) {
      this.setState({ connectionSourceItem: targetItem })
    } else {
      this.setState({ connectionSourceItem: null })
    }
  }

  addItemClicked () {
    this.props.addItem({ type: 'node' }).then(this.merge.bind(this))
  }

  onItemSelect (item) {
    this.props.onItemSelect(item)

    if (this.state.connectionSourceItem) {
      this.props
        .connectItems(this.state.connectionSourceItem, item)
        .then(this.merge.bind(this))
        .then(() => this.setState({ connectionSourceItem: null }))

      this.setState({ connectionSourceItem: null })
    }
  }

  merge (graph) {
    this.graph.addNodes(mapNodes(graph.nodes))
    this.graph.addRelationships(
      mapRelationships(graph.relationships, this.graph)
    )
  }

  getVisualAreaHeight () {
    return this.props.frameHeight && this.props.fullscreen
      ? this.props.frameHeight -
          (dim.frameStatusbarHeight + dim.frameTitlebarHeight * 2)
      : this.props.frameHeight - dim.frameStatusbarHeight ||
          this.svgElement.parentNode.offsetHeight
  }

  componentDidMount() {
    if (this.svgElement != null) {
      this.initGraphView()
      this.graph && this.props.setGraph && this.props.setGraph(this.graph)
      this.props.getAutoCompleteCallback &&
        this.props.getAutoCompleteCallback(this.addInternalRelationships)
      this.props.assignVisElement &&
        this.props.assignVisElement(this.svgElement, this.graphView)
    }
  }

  initGraphView() {
    if (!this.graphView) {
      const NeoConstructor = graphView
      const measureSize = () => {
        return {
          width: this.svgElement.offsetWidth,
          height: this.getVisualAreaHeight()
        }
      }
      this.graph = createGraph(this.props.nodes, this.props.relationships)
      this.graphView = new NeoConstructor(
        this.svgElement,
        measureSize,
        this.graph,
        this.props.graphStyle
      )
      this.graphEH = new GraphEventHandler(
        this.graph,
        this.graphView,
        this.props.getNodeNeighbours,
        this.props.onItemMouseOver,
        this.onItemSelect.bind(this),
        this.props.onGraphModelChange
      )
      this.graphEH.bindEventHandlers()
      this.props.onGraphModelChange(getGraphStats(this.graph))
      this.graphView.resize()
      this.graphView.update()
    }
  }

  addInternalRelationships = internalRelationships => {
    if (this.graph) {
      this.graph.addInternalRelationships(
        mapRelationships(internalRelationships, this.graph)
      )
      this.props.onGraphModelChange(getGraphStats(this.graph))
      this.graphView.update()
      this.graphEH.onItemMouseOut()
    }
  }

  componentWillReceiveProps(props) {
    if (props.styleVersion !== this.props.styleVersion) {
      this.graphView.update()
    }
    if (
      this.props.fullscreen !== props.fullscreen ||
      this.props.frameHeight !== props.frameHeight
    ) {
      this.setState({ shouldResize: true })
    } else {
      this.setState({ shouldResize: false })
    }
  }

  componentDidUpdate() {
    if (this.state.shouldResize) {
      this.graphView.resize()
    }
  }

  zoomButtons() {
    if (this.props.fullscreen) {
      return (
        <StyledZoomHolder>
          <StyledZoomButton
            className={
              this.state.zoomInLimitReached ? 'faded zoom-in' : 'zoom-in'
            }
            onClick={this.zoomInClicked.bind(this)}
          >
            <ZoomInIcon />
          </StyledZoomButton>
          <StyledZoomButton
            className={
              this.state.zoomOutLimitReached ? 'faded zoom-out' : 'zoom-out'
            }
            onClick={this.zoomOutClicked.bind(this)}
          >
            <ZoomOutIcon />
          </StyledZoomButton>
        </StyledZoomHolder>
      )
    }
    return null
  }

  editButton () {
    const item = this.props.selectedItem
    const hasType = !!item
    const isCanvas = hasType && item['type'] === 'canvas'
    const isNode = hasType && item['type'] === 'node'
    const isRelationship = hasType && item['type'] === 'relationship'
    const isInLinkMode = !!this.state.connectionSourceItem

    return (
      <StyledEditHolder>
        <StyledEditButton
          className={
            !isInLinkMode && hasType && !isCanvas ? 'bin' : 'faded bin'
          }
          onClick={() =>
            !isInLinkMode && hasType && !isCanvas && this.trashItemClicked()
          }
        >
          <TrashItemIcon />
        </StyledEditButton>
        <StyledEditButton
          className={
            !isInLinkMode && (isNode || isRelationship)
              ? 'pencil-circle'
              : 'faded pencil-circle'
          }
          onClick={() =>
            !isInLinkMode &&
            (isNode || isRelationship) &&
            this.editItemClicked()
          }
        >
          <EditItemIcon />
        </StyledEditButton>
        <StyledConnectButton
          className={isNode ? 'link' : 'faded link'}
          onClick={() => isNode && this.connectItemClicked()}
          active={isInLinkMode}
        >
          <ConnectItemIcon />
        </StyledConnectButton>
        <StyledEditButton
          className={
            !isInLinkMode && (!hasType || isCanvas)
              ? 'add-circle'
              : 'faded add-circle'
          }
          onClick={() =>
            !isInLinkMode && (!hasType || isCanvas) && this.addItemClicked()
          }
        >
          <AddItemIcon />
        </StyledEditButton>
      </StyledEditHolder>
    )
  }

  editForm () {
    return (
      <StyledEditFormHolder>
        <Drawer theme='blue'>
          <DrawerBody>
            <DrawerSection>
              <DrawerSubHeader>Edit Element</DrawerSubHeader>
              <DrawerSectionBody>
                <DrawerSection>Type</DrawerSection>
                <FormButton
                  label={'delete'}
                  onClick={() => alert('ok')}
                  buttonType='drawer'
                />
                <p>&nbsp;</p>
                <FormButton
                  label='save'
                  onClick={() => alert('ok')}
                  buttonType='drawer'
                />
              </DrawerSectionBody>
            </DrawerSection>
          </DrawerBody>
        </Drawer>
      </StyledEditFormHolder>
    )
  }

  render () {
    return (
      <StyledSvgWrapper>
        <svg className='neod3viz' ref={this.graphInit.bind(this)} />
        {this.editButton()}
        {this.zoomButtons()}
      </StyledSvgWrapper>
    )
  }
}
