
import type { ServiceErrorProps } from './types';

const ServiceError = ({ preError, postError }: ServiceErrorProps) => {
  if (!preError && !postError) {
    return null;
  }

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3">
      {preError && <div>Pre-state error: {preError}</div>}
      {postError && <div>Post-state error: {postError}</div>}
    </div>
  );
};

export default ServiceError;