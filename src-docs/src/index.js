import React, { createElement } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Switch, Route, Redirect } from 'react-router';
import { Helmet } from 'react-helmet';

import configureStore, { history } from './store/configure_store';

import { AppContext } from './views/app_context';
import { AppView } from './views/app_view';
import { HomeView } from './views/home/home_view';
import { NotFoundView } from './views/not_found/not_found_view';
import { registerTheme, ExampleContext } from './services';

import Routes from './routes';
import themeLight from './theme_light.scss';
import themeDark from './theme_dark.scss';
import { ThemeProvider } from './components/with_theme/theme_context';
import ScrollToHash from './components/scroll_to_hash';

registerTheme('light', [themeLight]);
registerTheme('dark', [themeDark]);

// Set up app

const store = configureStore();

const childRoutes = [].concat(Routes.getAppRoutes());
childRoutes.push({
  path: '*',
  component: NotFoundView,
  name: 'Page Not Found',
});

const routes = [
  {
    path: '/',
    component: HomeView,
    name: 'Elastic UI',
  },
  ...childRoutes,
];

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider>
      <AppContext>
        <Router history={history}>
          <ScrollToHash />
          <Switch>
            {routes.map(
              ({ name, path, sections, isNew, component, from, to }) => {
                const meta = (
                  <Helmet>
                    <title>{`${name} - Elastic UI Framework`}</title>
                  </Helmet>
                );
                const mainComponent = (
                  <Route
                    key={path}
                    path={`/${path}`}
                    render={(props) => {
                      const { location } = props;
                      // prevents encoded urls with a section id to fail
                      if (location.pathname.includes('%23')) {
                        const url = decodeURIComponent(location.pathname);
                        return <Redirect push to={url} />;
                      } else {
                        return (
                          <AppView
                            currentRoute={{ name, path, sections, isNew }}
                          >
                            {({ theme }) => (
                              <>
                                {meta}
                                {createElement(component, {
                                  selectedTheme: theme,
                                  title: name,
                                })}
                              </>
                            )}
                          </AppView>
                        );
                      }
                    }}
                  />
                );

                const standaloneSections = (sections || [])
                  .map(({ id, fullScreen }) => {
                    if (!fullScreen) return undefined;
                    const { slug, demo } = fullScreen;
                    return (
                      <Route
                        key={`/${path}/${slug}`}
                        path={`/${path}/${slug}`}
                        render={() => (
                          <ExampleContext.Provider
                            value={{ parentPath: `/${path}#${id}` }}
                          >
                            {meta}
                            {demo}
                          </ExampleContext.Provider>
                        )}
                      />
                    );
                  })
                  .filter((x) => !!x);

                // place standaloneSections before mainComponent so their routes take precedent
                const routes = [...standaloneSections, mainComponent];

                if (from)
                  return [
                    ...routes,
                    <Route exact path={`/${from}`}>
                      <Redirect to={`/${to}`} />
                    </Route>,
                  ];
                else if (component) return routes;
                return null;
              }
            )}
          </Switch>
        </Router>
      </AppContext>
    </ThemeProvider>
  </Provider>,
  document.getElementById('guide')
);
