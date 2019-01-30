import * as React from 'react';
import Select, { Option } from 'react-select';
import { VariableError } from '../VariableError';
import { IVariableInputBuilder, VariableInputService, IVariable, IVariableProps } from './variableInput.service';

// Trying to merge this with the imported interface in variableInput.service
// caused type errors so its duplicated here in the form we need
export interface IVariableState {
  selectedOption: string;
}

class SelectInput extends React.Component<IVariableProps, IVariableState> {
  constructor(props: IVariableProps) {
    super(props);
    const { variable } = this.props;
    this.state = {
      selectedOption: Array.isArray(variable.value) ? variable.value[0] : (variable.value as string),
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
