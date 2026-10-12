import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Counter, counterLabel, type CounterArgs } from './Counter.ts';

const meta = {
  title: 'Proof/Counter',
  render: (args: CounterArgs) => Counter(args),
  args: { disabled: false },
} satisfies Meta<CounterArgs>;

export default meta;
type Story = StoryObj<CounterArgs>;

export const Basic: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent(counterLabel + '0');
    await userEvent.click(canvas.getByRole('button', { name: '增加' }));
    await userEvent.click(canvas.getByRole('button', { name: '增加' }));
    await expect(canvas.getByRole('status')).toHaveTextContent(counterLabel + '2');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: '增加' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(canvas.getByRole('status')).toHaveTextContent(counterLabel + '0');
  },
};
