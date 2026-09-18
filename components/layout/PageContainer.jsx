export default function PageContainer({
  children,
  className = '',
  as: Component = 'main',
}) {
  return (
    <Component className={`page-container ${className}`.trim()}>
      {children}
    </Component>
  );
}