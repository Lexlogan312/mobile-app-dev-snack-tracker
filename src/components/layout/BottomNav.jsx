import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Lightbulb, ShoppingCart, LayoutDashboard, Settings } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { useFavorites } from '../../hooks/useFavorites';

const BottomNav = () => {
  const { isAdmin } = useAdmin();
  const { favorites } = useFavorites();

  const guestNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/favorites', icon: Heart, label: 'Favorites', badge: favorites.length },
    { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
  ];

  const adminNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
    { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping' },
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = isAdmin ? adminNavItems : guestNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] pb-safe-bottom shadow-[0_-4px_20px_rgba(124,58,237,0.05)] z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-[var(--color-primary-soft)]' : ''} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[var(--color-secondary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-[var(--color-primary)] rounded-full opacity-50" />
                  )}
                </div>
                <span className="text-[10px] font-bold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
