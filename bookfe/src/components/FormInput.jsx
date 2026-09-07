import React from 'react';

export default function FormInput({
  label,
  type = 'text',
  inputRef,
  icon: Icon,
  placeholder,
  required = false,
  rightElement = null,
  inputClassName = 'client-input',
  labelStyle = {},
  maxLength,
  value,
  onChange,
  ...rest
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" style={labelStyle}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon-left">
            <Icon size={18} />
          </span>
        )}
        <input
          ref={inputRef}
          type={type}
          className={inputClassName}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          {...rest}
        />
        {rightElement}
      </div>
    </div>
  );
}
