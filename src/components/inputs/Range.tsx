import React, { useEffect } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

interface RangeProps {
  value?: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  ticks?: number[];
}

export function Range(props: RangeProps) {
  const [value, setValue] = React.useState(props.value || 0)
  const debouncedValue = useDebounce(value, 500)
  const min = props.min || 0
  const max = props.max || 100
  const listId = `${props.label}-list`

  useEffect(() => {
    props.onChange(debouncedValue)
  }, [debouncedValue])

  return (
    <div className="relative font-semibold text-xs text-neutral-500 -mb-2">
      <label className="absolute text-xxs -top-2 left-1.5 px-1">
        {props.label}
      </label>
      <div className="absolute text-xxs -top-2 right-1.5 px-1">
        {value.toString()}
        {props.unit || ''}
      </div>
      <div className="h-11 outline-none rounded-md w-full text-neutral-900 flex items-center justify-center">
        <input
          className="w-full h-1 bg-neutral-300 rounded"
          type="range"
          name="price"
          min={min}
          max={max}
          step={props.step || 1}
          value={value}
          list={listId}
          onChange={(e) => setValue(Number(e.currentTarget.value))}
        />
        {props.ticks && (
          <datalist id={listId}>
            {props.ticks.map((tick, index) => <option key={`tick-${index}`} value={tick} />)}
          </datalist>
        )}
      </div>
    </div>
  )
}
