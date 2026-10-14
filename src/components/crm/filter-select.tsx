import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

/** Compact toolbar filter. `all` adds a leading "all" option whose value is 'all'. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  all,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  all?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size='sm' aria-label={label} className={`filter-select ${value !== 'all' && value !== 'any' ? 'is-active' : ''}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position='popper' align='start'>
        {all && <SelectItem value='all'>{all}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
