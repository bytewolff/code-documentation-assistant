import { CONSTANTS } from 'src/common/constants';

const {
  ALLOWED_EXTENSIONS,
  IGNORED_PATH_SEGMENTS,
  IGNORED_FILENAMES,
  MAX_FILE_SIZE_BYTES,
} = CONSTANTS.fileFilter;

export function isIngestibleFile(path: string, sizeBytes: number): boolean {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return false;
  }

  const fileName = path.split('/').pop() ?? '';
  if (IGNORED_FILENAMES.has(fileName)) {
    return false;
  }

  if (IGNORED_PATH_SEGMENTS.some((segment) => path.includes(segment))) {
    return false;
  }

  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return false;
  }
  const extension = fileName.slice(dotIndex).toLowerCase();

  return ALLOWED_EXTENSIONS.has(extension);
}
