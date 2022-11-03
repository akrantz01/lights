import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, LightBulbIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, LinkGetProps, useLocation } from '@reach/router';
import classNames from 'classnames';
import React, { Fragment, MouseEvent } from 'react';

import { buildAuthorizationUrl, logout as oauthLogout } from '../oauth';
import { logout, useDispatch, useProfile } from '../store';
import StatusIndicator from './StatusIndicator';

interface NavItem {
  name: string;
  href: string;
  hidden?: boolean;
  external?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/' },
  { name: 'Animations', href: '/animations' },
  { name: 'Presets', href: '/presets' },
  { name: 'Schedules', href: '/schedules' },
  { name: 'GitHub', href: 'https://github.com/akrantz01/lights', external: true },
  { name: 'New Schedule', href: '/new/schedule', hidden: true },
  { name: 'New Preset', href: '/new/preset', hidden: true },
  { name: 'New Animation', href: '/new/animation', hidden: true },
  { name: 'Logging in...', href: '/oauth/callback', hidden: true },
];

const ProfilePicture = (): JSX.Element => {
  const profile = useProfile();

  if (profile?.avatar) return <img className="h-8 w-8 rounded-full" src={profile.avatar} alt="user profile picture" />;
  else return <UserIcon className="h-8 w-8 rounded-full text-gray-500" />;
};

const Navigation = (): JSX.Element => {
  const profile = useProfile();
  const dispatch = useDispatch();
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
      'block px-3 py-2 rounded-md text-sm font-medium',
    ),
  });

  const authAction = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (profile) {
      oauthLogout();
      dispatch(logout);
    } else {
      const url = await buildAuthorizationUrl();
      window.location.assign(url);
    }
  };

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
                          .map((item) => {
                            if (item.external) {
                              return (
                                <a
                                  key={item.name}
                                  href={item.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-300 hover:bg-gray-700 hover:text-white inline px-3 py-2 rounded-md text-sm font-medium"
                                >
                                  {item.name}
                                </a>
                              );
                            } else {
                              return (
                                <Link key={item.name} to={item.href} getProps={isActive}>
                                  {item.name}
                                </Link>
                              );
                            }
                          })}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <StatusIndicator />

                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <ProfilePicture />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {profile && (
                              <Menu.Item>
                                <span className="block px-4 py-2 text-sm text-gray-700 w-full text-left">
                                  {profile.name}
                                </span>
                              </Menu.Item>
                            )}
                            <Menu.Item>
                              <button
                                type="button"
                                onClick={authAction}
                                className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-200"
                              >
                                Sign {profile ? 'out' : 'in'}
                              </button>
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                  <div className="md:hidden -mr-2 flex">
                    <StatusIndicator />
                    <Disclosure.Button className="md:hidden bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
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
                <div className="pt-4 pb-3 border-t border-gray-700">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <ProfilePicture />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">{profile?.name}</div>
                      <div className="text-sm font-medium text-gray-400">{profile?.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <button
                      type="button"
                      onClick={authAction}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      Sign {profile ? 'out' : 'in'}
                    </button>
                  </div>
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
