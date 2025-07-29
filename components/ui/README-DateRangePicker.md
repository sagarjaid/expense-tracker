# DateRangePicker Component

A comprehensive date range picker component built for Shadcn UI using Radix UI and Tailwind CSS. This component provides a dropdown interface to allow users to select or enter a range of dates with preset options.

## Features

- **Two-month calendar view** for easy range selection
- **Preset date ranges** (Today, Yesterday, Last 7 days, Last 14 days, Last 30 days, This Week, Last Week, This Month, Last Month)
- **Manual date input** with calendar picker
- **Clear and Update buttons** for better UX
- **Responsive design** that works on all screen sizes
- **No compare option** (as requested)

## Installation

The component depends on the following shadcn components:
- Button
- Calendar
- Label
- Popover
- Switch

And the following Radix UI packages:
- @radix-ui/react-switch
- @radix-ui/react-icons

## Usage

### Basic Usage

```tsx
import { DateRangePicker } from '@/components/ui/date-range-picker-new';

function MyComponent() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  return (
    <DateRangePicker
      onUpdate={setDateRange}
      align="start"
    />
  );
}
```

### With Initial Values

```tsx
<DateRangePicker
  initialDateFrom={new Date('2024-01-01')}
  initialDateTo={new Date('2024-01-31')}
  onUpdate={(range) => console.log('Date range updated:', range)}
  align="center"
/>
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `onUpdate` | `function` | - | Callback function that is called when the date range is updated. Receives an object with `from` and `to` Date objects. |
| `initialDateFrom` | `Date \| string` | Today's Date | The initial start date for the date range. |
| `initialDateTo` | `Date \| string` | - | The initial end date for the date range. |
| `align` | `'start' \| 'center' \| 'end'` | `'end'` | The alignment of the dropdown popover. |
| `locale` | `string` | `'en-US'` | The locale used for date formatting (currently not used in format function). |
| `className` | `string` | - | Additional CSS classes for styling. |

## Preset Options

The component includes the following preset date ranges:

- **Today**: Current day
- **Yesterday**: Previous day
- **Last 7 days**: 7 days ago to today
- **Last 14 days**: 14 days ago to today
- **Last 30 days**: 30 days ago to today
- **This Week**: Start to end of current week
- **Last Week**: Start to end of previous week
- **This Month**: Start to end of current month
- **Last Month**: Start to end of previous month

## Demo

Visit `/date-picker-demo` to see the component in action with various configurations.

## Migration from Old Component

The old `DateRangePicker` component is still available for backward compatibility, but it's recommended to use the new one for better UX and functionality.

```tsx
// Old way (still works)
import { DateRangePicker } from '@/components/ui/date-range-picker';

// New way (recommended)
import { DateRangePicker } from '@/components/ui/date-range-picker-new';
```

## Implementation in ExpenseDashboard

The component has been integrated into the ExpenseDashboard to replace the previous date picker implementation. It provides a much better user experience with:

- Easier date range selection
- Preset options for common date ranges
- Better visual feedback
- More intuitive interface 