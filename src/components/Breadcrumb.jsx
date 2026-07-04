import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  // Filter out any duplicate root 'Trang chủ' link if it's passed in the items array
  const cleanItems = items ? items.filter(item => {
    const isRootLabel = item.label && (item.label.toLowerCase() === 'trang chủ' || item.label.toLowerCase() === 'trang chu');
    const isRootLink = item.path === '/' || item.link === '/';
    return !(isRootLabel || isRootLink);
  }) : [];

  return (
    <nav className="flex items-center text-sm mb-4 text-gray-600">
      <Link to="/" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
        Trang chủ
      </Link>
      
      {cleanItems.length > 0 && cleanItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="mx-2 text-gray-400">›</span>
          {(item.path || item.link) ? (
            <Link to={item.path || item.link} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-bold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
