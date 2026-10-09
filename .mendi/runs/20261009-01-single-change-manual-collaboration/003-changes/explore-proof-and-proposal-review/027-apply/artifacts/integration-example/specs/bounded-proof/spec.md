## ADDED Requirements
### Requirement: Missing tool fails
The system SHALL fail without installing a missing tool.
#### Scenario: Missing input
- **WHEN** the selected tool is missing
- **THEN** fail without installing

#### Scenario: Unsafe managed path
- **WHEN** a required managed path escapes the target
- **THEN** fail without reading or writing outside
