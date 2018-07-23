import React, { Component } from 'react'
import {
  EditFormButton,
  StyledModalFormBody,
  StyledModalFormHolder,
  StyledModalFormWrapper,
  FormElement,
  FormElements,
  FormHeader,
  FormLabel,
  FormValue
} from './styled'
import {
  CloseIcon,
  PlainPlayIcon
} from 'src-root/browser/components/icons/Icons'
import { Textarea, TextInput } from 'src-root/browser/components/Form'

export class EditForm extends Component {
  KEY_CONVENTION = /^[^\d\s]\S+$/i

  constructor (props) {
    super(props)
    this.result = {}
    this.state = {
      isValid: false
    }
  }

  formElements () {
    throw new Error('You have to implement this method!')
  }

  isValid () {
    throw new Error('You have to implement this method!')
  }

  handleSubmit (event) {
    this.props.onSubmit(this.result)
    this.props.onClose()
    event.preventDefault()
  }

  handleChange (event) {
    this.result[event.target.name] = event.target.value
    this.setState({ isValid: this.isValid() })
  }

  render () {
    return (
      <StyledModalFormHolder>
        <StyledModalFormWrapper>
          <StyledModalFormBody>
            <form onSubmit={this.handleSubmit.bind(this)}>
              {this.formElements()}
              <div
                style={{
                  paddingTop: '10px'
                }}
              >
                <EditFormButton
                  key='save'
                  label='Save'
                  icon={<PlainPlayIcon />}
                  onClick={this.handleSubmit.bind(this)}
                  disabled={!this.state.isValid}
                />
                <EditFormButton
                  key='cancel'
                  label='Cancel'
                  icon={<CloseIcon />}
                  onClick={this.props.onClose}
                />
              </div>
            </form>
          </StyledModalFormBody>
        </StyledModalFormWrapper>
      </StyledModalFormHolder>
    )
  }
}

export class EditPropertyForm extends EditForm {
  constructor (props) {
    super(props)
    this.result = {
      key: props.values.key || '',
      value: props.values.value || ''
    }
  }

  isValid () {
    return this.result.key.match(this.KEY_CONVENTION)
  }

  formElements () {
    return (
      <FormElements>
        <FormHeader>Add/Edit Property</FormHeader>

        <FormElement>
          <FormLabel>Key</FormLabel>
          <FormValue>
            <TextInput
              name='key'
              defaultValue={this.props.values.key}
              onChange={this.handleChange.bind(this)}
            />
          </FormValue>
        </FormElement>

        <FormElement>
          <FormLabel>Value</FormLabel>
          <FormValue>
            <Textarea
              name='value'
              rows='6'
              defaultValue={this.props.values.value}
              onChange={this.handleChange.bind(this)}
            />
          </FormValue>
        </FormElement>
      </FormElements>
    )
  }
}