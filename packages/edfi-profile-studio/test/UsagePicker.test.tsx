/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { UsagePicker } from '../src/components/UsagePicker';

describe('UsagePicker', () => {
  it('renders all five statuses by default', () => {
    render(<UsagePicker value="in-use" onChange={() => {}} />);
    const select = screen.getByLabelText('usage status') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['in-use', 'partial', 'not-populated', 'not-implemented', 'planned']);
  });

  it('can restrict options (properties exclude not-implemented)', () => {
    render(<UsagePicker value="in-use" options={['in-use', 'partial', 'not-populated', 'planned']} onChange={() => {}} />);
    const select = screen.getByLabelText('usage status') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).not.toContain('not-implemented');
  });

  it('emits the selected status', () => {
    const onChange = jest.fn();
    render(<UsagePicker value="in-use" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('usage status'), { target: { value: 'partial' } });
    expect(onChange).toHaveBeenCalledWith('partial');
  });

  it('emits undefined when the unset option is chosen', () => {
    const onChange = jest.fn();
    render(<UsagePicker value="in-use" includeUnset onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('usage status'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
