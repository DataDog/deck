import * as React from 'react';
import Select, { Option } from 'react-select';
import { VariableError } from '../VariableError';

import {
  IVariableInputBuilder,
  VariableInputService,
  IVariable,
  IVariableProps,
  IVariableState,
} from './variableInput.service';
import { values } from 'd3';

// Merges with existing interface
export interface IVariableState {
  selectedOption: string;
}

class SelectInput extends React.Component<IVariableProps, IVariableState> {
  constructor(props: IVariableProps) {
    super(props);
    const { variable } = this.props;
    this.state = {
      selectedOption: Array.isArray(variable.value) ? variable.value[0] : variable.value,
    };
  }

  private handleSelectChange = (option: Option): void => {
    this.setState({ selectedOption: option.value as string });
    this.props.onChange({
      value: option.value as string,
      type: this.props.variable.type,
      name: this.props.variable.name,
    });
  };

  public render() {
    const { variable } = this.props;
    const { selectedOption } = this.state;
    const options: Option[] = (variable.options || []).map((o: string) => {
      return { value: o, label: o };
    });

    return (
      <div>
        <Select options={options} clearable={false} value={selectedOption} onChange={this.handleSelectChange} />

        {!this.props.variable.hideErrors && <VariableError errors={this.props.variable.errors} />}
      </div>
    );
  }
}

export class SelectInputBuilder implements IVariableInputBuilder {
  public handles(type: string): boolean {
    return type === 'select';
  }

  public getInput(variable: IVariable, onChange: (variable: IVariable) => void) {
    return <SelectInput variable={variable} onChange={onChange} />;
  }
}

VariableInputService.addInput(new SelectInputBuilder());
