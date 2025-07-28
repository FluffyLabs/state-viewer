import ArrayViewer from './ArrayViewer';
import ObjectViewer from './ObjectViewer';
import ToStringViewer from './ToStringViewer';

interface CompositeViewerProps {
  value: unknown;
}

const CompositeViewer = ({ value }: CompositeViewerProps) => {
  const renderValue = (val: unknown) => <CompositeViewer value={val} />;

  if (value === null) {
    return <span className="text-gray-500 italic">null</span>;
  }
  if (Array.isArray(value)) {
    return <ArrayViewer array={value} renderValue={renderValue} />;
  }
  if (typeof value === 'object' && Object.hasOwnProperty.call(value, 'toJSON')) {
    return <ToStringViewer value={value} />;
  }
  if (typeof value === 'object' && Object.prototype.toString === value.toString) {
    return <ObjectViewer value={value as Record<string, unknown>} renderValue={renderValue} />;
  }
  return <ToStringViewer value={value} />;
};

export default CompositeViewer;