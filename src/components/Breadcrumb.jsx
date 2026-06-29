import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center text-sm mb-4 text-gray-600">
      {items && items.length > 0 && items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2 text-gray-400">›</span>}
          {(item.path || item.link) ? (
            <Link to={item.path || item.link} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
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
