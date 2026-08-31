import { useId, useState } from 'react'

export default function FormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  optional = false,
  placeholder,
  icon,
  rows,
  autoComplete,
  hint,
  className = '',
  children,
  showPasswordToggle = false,
}) {
  const reactId = useId()
  const inputId = `field-${name}-${reactId}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const [passwordVisible, setPasswordVisible] = useState(false)
  const actualType = type === 'password' && showPasswordToggle && passwordVisible ? 'text' : type

  const errorCls = error ? '!border-red-500 focus:!ring-red-500' : ''
  const paddingCls = icon || (type === 'password' && showPasswordToggle) ? '' : '!pl-4'
  const rightPadCls = type === 'password' && showPasswordToggle ? '!pr-12' : ''

  const describedBy = error ? errorId : hint ? hintId : undefined

  let input
  if (type === 'textarea') {
    input = (
      <textarea
        id={inputId}
        name={name}
        rows={rows || 3}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`form-textarea !pl-4 ${errorCls} ${className}`}
      />
    )
  } else if (type === 'select') {
    input = (
      <select
        id={inputId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`form-select ${paddingCls} ${errorCls} ${className}`}
      >
        {children}
      </select>
    )
  } else if (type === 'checkbox') {
    input = (
      <input
        id={inputId}
        name={name}
        type="checkbox"
        checked={!!value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className="h-4 w-4 rounded border-gray-300 text-[#047857] focus:ring-[#047857]"
      />
    )
  } else {
    input = (
      <input
        id={inputId}
        name={name}
        type={actualType}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`form-input ${paddingCls} ${rightPadCls} ${errorCls} ${className}`}
      />
    )
  }

  if (type === 'checkbox') {
    return (
      <div>
        <div className="flex items-start gap-2">
          {input}
          {label && (
            <label htmlFor={inputId} className="text-sm text-gray-700 cursor-pointer">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
              {optional && !required && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Optional</span>}
            </label>
          )}
        </div>
        {hint && !error && <p id={hintId} className="mt-1 text-xs text-gray-500 ml-6">{hint}</p>}
        {error && <p id={errorId} className="form-error ml-6">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="form-label flex items-center gap-2">
          {label}
          {required && <span className="text-red-500">*</span>}
          {optional && !required && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Optional</span>}
        </label>
      )}
      {icon || (type === 'password' && showPasswordToggle) ? (
        <div className="relative">
          {icon && (
            <i className={`material-icons-round pointer-events-none absolute left-4 ${type === 'textarea' ? 'top-4' : 'top-1/2 -translate-y-1/2'} text-gray-400`}>{icon}</i>
          )}
          {input}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setPasswordVisible((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-[#047857]"
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            >
              <i className="material-icons-round">{passwordVisible ? 'visibility_off' : 'visibility'}</i>
            </button>
          )}
        </div>
      ) : input}
      {hint && !error && <p id={hintId} className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  )
}
