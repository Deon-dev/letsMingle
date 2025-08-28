export default function TypingIndicator({ names }) {
  return (
    <div className="text-xs text-gray-500 px-3 py-2">{names ? `${names}` : 'typing...'}</div>
  );
}
