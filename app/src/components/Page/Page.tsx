import React from 'react';
import { Layout, notification } from 'antd';
import { Flex, FlexProps } from 'reflexy';
import classNames from 'classnames';
import { IReactionDisposer, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { UIStore } from 'module/mobx-utils';
import { RootStore } from 'stores';
import Loader from 'components/Loader';
import css from './Page.css';
import { TabixUpdate } from 'services';

interface Props extends FlexProps {
  uiStore?: UIStore<RootStore>;
  children?: React.ReactNode;
  showHeader?: boolean;
}

const { Header, Footer } = Layout;

@observer
export default class Page extends React.Component<Props> {
  private readonly notificationReaction: IReactionDisposer;

  state = {
    currentVersion: '',
    newVersion: '',
    link: '',
    dataUpdate: Date.now(),
  };

  constructor(props: Props) {
    super(props);

    this.notificationReaction = reaction(
      () => {
        const { uiStore } = this.props;
        return uiStore && uiStore.notifications;
      },
      (list) =>
        list &&
        list.forEach((n) => {
          notification.open({
            key: n.id.toString(),
            type: n.type,
            message: n.text,
            description: '',
            style: {
              width: 600,
              marginLeft: 335 - 600,
            },
            // duration: 30,
            onClose: () => {
              const { uiStore } = this.props;
              uiStore && uiStore.closeNotification(n.id);
            },
          });
        }),
      { fireImmediately: true }
    );
  }
  componentDidMount() {
    // Mount?
    this.checkVersionUpdateTabix();
  }

  componentWillUnmount() {
    this.notificationReaction();
  }
  renderPage() {
    const { uiStore, className, showHeader, ...rest } = this.props;
    // hide page loader while showing app loader to avoid double loaders
    // (!store.uiStore.loading || uiStore === store.uiStore);

    return (
      <Flex
        column
        hfill
        grow
        shrink={false}
        component={<main />}
        className={classNames(css['main-container'], className)}
        {...rest}
      />
    );
  }

  renderHeader() {
    return (
      <Header>
        <div className="logo" />{' '}
      </Header>
    );
  }

  checkVersionUpdateTabix = async () => {
    try {
      this.state.currentVersion = TabixUpdate.getTabixBuildVersion();
      const v = await TabixUpdate.checkVersionUpdateTabix(undefined);

      if (v.haveUpdate) {
        this.state.newVersion = v.newVersion;
        this.state.link = v.link;
      }
      console.log('checkVersionUpdateTabix', v);
    } catch (e) {
      console.warn('Can`t check Tabix update');
    }
    return false;
  };

  renderFooter() {
    // Check update here?
    const currentV = this.state.currentVersion;

    return <Footer style={{ textAlign: 'center' }}>Tabix ©2022 Version: {currentV}</Footer>;
  }

  render() {
    const { uiStore, className, showHeader, ...rest } = this.props;
    const showLoader = uiStore && uiStore.loading;

    return (
      <Layout className={css.root}>
        {showLoader && <Loader />}
        {showHeader && this.renderHeader()}
        {this.renderPage()}
        {showHeader && this.renderFooter()}
      </Layout>
    );
  }
}
