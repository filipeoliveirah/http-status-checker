import { HttpCategory } from '../../../domain/httpStatus'

export const STATUS_TEXT_CLASS = {
  [HttpCategory.INFORMATIONAL]: 'text-sky-600',
  [HttpCategory.SUCCESS]: 'text-emerald-600',
  [HttpCategory.REDIRECT]: 'text-blue-600',
  [HttpCategory.CLIENT_ERROR]: 'text-orange-600',
  [HttpCategory.SERVER_ERROR]: 'text-red-600',
}

export const STATUS_PILL_CLASS = {
  [HttpCategory.INFORMATIONAL]: 'bg-sky-50 text-sky-600',
  [HttpCategory.SUCCESS]: 'bg-emerald-50 text-emerald-600',
  [HttpCategory.REDIRECT]: 'bg-blue-50 text-blue-600',
  [HttpCategory.CLIENT_ERROR]: 'bg-orange-50 text-orange-600',
  [HttpCategory.SERVER_ERROR]: 'bg-red-50 text-red-600',
}
