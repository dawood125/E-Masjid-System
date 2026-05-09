import { useForm as useReactHookForm, useFieldArray } from 'react-hook-form'

export function useForm(schema, defaultValues, onSubmit) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    getValues,
  } = useReactHookForm({
    defaultValues,
    mode: 'onBlur',
  })

  return {
    register,
    control,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    errors,
    isSubmitting,
    isValid,
    reset,
    setValue,
    getValues,
  }
}

export { useFieldArray }
