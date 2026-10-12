import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import CounterPanel from './CounterPanel.vue'

const meta = {
  title: 'Counter/CounterPanel',
  component: CounterPanel,
} satisfies Meta<typeof CounterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const count = canvas.getByLabelText('当前数值')
    await expect(count).toHaveTextContent(/^0$/)
    await userEvent.click(canvas.getByRole('button', { name: '加一' }))
    await expect(count).toHaveTextContent(/^1$/)
    await userEvent.click(canvas.getByRole('button', { name: '重置' }))
    await expect(count).toHaveTextContent(/^0$/)
  },
}

export const ExistingValue: Story = {
  args: { initialCount: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const count = canvas.getByLabelText('当前数值')
    await expect(count).toHaveTextContent(/^5$/)
    await userEvent.click(canvas.getByRole('button', { name: '加一' }))
    await expect(count).toHaveTextContent(/^6$/)
    await userEvent.click(canvas.getByRole('button', { name: '重置' }))
    await expect(count).toHaveTextContent(/^0$/)
  },
}

export const Disabled: Story = {
  args: { initialCount: 5, disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const increment = canvas.getByRole('button', { name: '加一' })
    const reset = canvas.getByRole('button', { name: '重置' })
    await expect(increment).toBeDisabled()
    await expect(reset).toBeDisabled()
    await userEvent.click(increment)
    await userEvent.click(reset)
    await expect(canvas.getByLabelText('当前数值')).toHaveTextContent(/^5$/)
  },
}
