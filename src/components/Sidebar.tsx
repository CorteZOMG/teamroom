import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      id: 'messenger',
      label: 'Повідомлення',
      icon: '💬',
      path: '/messenger'
    },
    {
      id: 'courser',
      label: 'Курси',
      icon: '📚',
      path: '/courser'
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-primary transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-white text-xl font-bold font-montserrat">
            TeamRoom
          </h2>
          <button
            onClick={onToggle}
            className="lg:hidden text-white hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2" data-testid="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={`menu-${item.id}`}
              onClick={() => {
                navigate(item.path);
                onToggle();
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${location.pathname === item.path 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium font-montserrat">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20 space-y-2">
          <button
            onClick={() => {
              navigate('/profile/create');
              onToggle();
            }}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
              ${location.pathname === '/profile/create' 
                ? 'bg-white/20 text-white' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <span className="text-xl">👤</span>
            <span className="font-medium font-montserrat">Профіль</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium font-montserrat">Вийти</span>
          </button>
        </div>
      </div>
    </>
  );
}
