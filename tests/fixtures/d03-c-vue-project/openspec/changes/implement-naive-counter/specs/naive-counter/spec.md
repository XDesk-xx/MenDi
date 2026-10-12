# Spec Delta

## Purpose

为使用者提供可独立操作的本地计数器：首次显示默认值或明确初值，每次加一立即更新显示，重置统一回到零；禁用状态保持当前数值，应用入口与示例展示遵循同一组行为。

## ADDED Requirements

### Requirement: Initial count

计数器 SHALL 在首次显示时使用提供的初值；未提供初值时 SHALL 显示 0。

#### Scenario: Default initial value

- **WHEN** 使用者打开未提供初值的计数器
- **THEN** 当前数值显示为 0

#### Scenario: Explicit initial value

- **WHEN** 使用者打开初值为 5 的计数器
- **THEN** 当前数值显示为 5

### Requirement: Increment count

计数器 SHALL 在未禁用时，每次加一操作将当前数值增加 1 并更新显示。

#### Scenario: Increment from zero

- **WHEN** 当前数值为 0 且未禁用，使用者执行一次加一
- **THEN** 当前数值显示为 1

#### Scenario: Increment explicit initial value

- **WHEN** 当前数值为 5 且未禁用，使用者执行一次加一
- **THEN** 当前数值显示为 6

### Requirement: Reset count

计数器 SHALL 在未禁用时，将重置操作的结果显示为 0，无论最初是否提供初值。

#### Scenario: Reset after increment

- **WHEN** 默认计数器加一后使用者执行重置
- **THEN** 当前数值显示为 0

#### Scenario: Reset explicit initial value

- **WHEN** 初值为 5 的计数器加一后使用者执行重置
- **THEN** 当前数值显示为 0，而非初值 5

### Requirement: Disabled counter

计数器 SHALL 在禁用时将加一和重置控件显示为禁用，并保持当前数值不因这两种操作改变。

#### Scenario: Disabled controls preserve count

- **WHEN** 初值为 5 的计数器处于禁用状态，使用者尝试加一或重置
- **THEN** 两个控件均为禁用，当前数值保持 5
