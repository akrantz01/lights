import { Disclosure, Transition } from '@headlessui/react';
import { LightBulbIcon, MenuIcon, XIcon } from '@heroicons/react/outline';
import { Link, LinkGetProps, useLocation } from '@reach/router';
import classNames from 'classnames';
import React from 'react';

import StatusIndicator from './StatusIndicator';

interface NavItem {
  name: string;
  href: string;
  hidden?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/' },
  { name: 'Animations', href: '/animations' },
  { name: 'Presets', href: '/presets' },
  { name: 'Schedules', href: '/schedules' },
  { name: 'New Schedule', href: '/new/schedule', hidden: true },
  { name: 'New Preset', href: '/new/preset', hidden: true },
  { name: 'New Animation', href: '/new/animation', hidden: true },
];

const Navigation = (): JSX.Element => {
  const { pathname } = useLocation();

  // Get the page name
  const pages = navigation
    .filter((item) => pathname.startsWith(item.href))
    .map((item) => item.name)
    .reverse(); // We reverse the result because "/" matches all routes
  const title = pages.length === 0 ? 'Not found' : pages[0];

  const isActive = ({ isCurrent }: LinkGetProps) => ({
    'aria-current': isCurrent ? 'page' : undefined,
    className: classNames(
      isCurrent ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
      'px-3 py-2 rounded-md text-sm font-medium',
    ),
  });

  return (
    <div className="bg-gray-800 pb-32">
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="border-b border-gray-700">
                <div className="flex items-center justify-between h-16 px-4 sm:px-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LightBulbIcon className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation
                          .filter((item) => !item.hidden)
                          .map((item) => (
                            <Link key={item.name} to={item.href} getProps={isActive}>
                              {item.name}
                            </Link>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="-mr-2 flex">
                    <StatusIndicator />
                    <Disclosure.Button className="md:hidden bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>
            </div>

            <Transition
              enter="transition duration-150 ease-out"
              enterFrom="transform -translate-y-3 scale-95 opacity-0"
              enterTo="transform translate-y-0 scale-100 opacity-100"
              leave="transition duration-150 ease-out"
              leaveFrom="transform translate-y-0 scale-100 opacity-100"
              leaveTo="transform -translate-y-3 scale-95 opacity-0"
            >
              <Disclosure.Panel className="border-b border-gray-700 md:hidden">
                <div className="px-2 py-3 space-y-1 sm:px-3">
                  {navigation
                    .filter((item) => !item.hidden)
                    .map((item) => (
                      <Disclosure.Button key={item.name} as={Link} to={item.href} getProps={isActive}>
                        {item.name}
                      </Disclosure.Button>
                    ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
      <header className="py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
        </div>
      </header>
    </div>
  );
};

export default Navigation;
