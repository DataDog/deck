import * as React from 'react';

export interface IVariable {
  name: string;
  value: any;
  type: string;
  errors?: IVariableError[];
  hideErrors?: boolean;
  options?: string[];
}

export interface IVariableError {
  message: string;
  // In most cases, variables just have error messages.
  // In the case of a list, each item can have its own error, so we have to have a way of tracking which item has an error.
  key?: number;
}

export interface IVariableInputBuilder {
  handles: (type: string) => boolean;
  getInput: (variable: IVariable, onChange: (variable: IVariable) => void) => React.ReactElement<IVariableProps>;
}

export interface IVariableProps {
  variable: IVariable;
  onChange: (variable: IVariable) => void;
}

export interface IVariableState {}

export class VariableInputService {
  private static inputs = new Set<IVariableInputBuilder>();

  public static addInput(input: IVariableInputBuilder): void {
    this.inputs.add(input);
  }

  // We do some duck typing of the variable to see if we should render it
  // in a SelectInput if the defaultValue is an array.
  public static getInputForType(type = 'string', defaultValue: any): IVariableInputBuilder {
    let inputType = type;
    if (type === 'string' && Array.isArray(defaultValue)) {
      inputType = 'select';
    }
    return Array.from(this.inputs).find(i => i.handles(inputType));
  }
}
