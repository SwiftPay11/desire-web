export default function LoadingScreen({
  text = 'Loading...',
}) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>

      <p>{text}</p>
    </div>
  );
}