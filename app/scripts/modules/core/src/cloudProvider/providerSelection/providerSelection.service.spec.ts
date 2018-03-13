import { APPLICATION_MODEL_BUILDER, ApplicationModelBuilder } from 'core/application/applicationModel.builder';
import { Application } from 'core/application/application.model';
import { mock, IQService, IScope, IRootScopeService } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';

import { ACCOUNT_SERVICE, AccountService } from 'core/account/account.service';
import { CLOUD_PROVIDER_REGISTRY, CloudProviderRegistry } from 'core/cloudProvider/cloudProvider.registry';
import { PROVIDER_SELECTION_SERVICE, ProviderSelectionService } from './providerSelection.service';
import { SETTINGS } from 'core/config/settings';

import { IAccountDetails } from 'core/account/account.service';

function fakeAccount(provider: string): IAccountDetails {
  return {
    cloudProvider: provider,
    accountId: 'foobaraccount',
    name: 'foo-bar-account',
    requiredGroupMembership: [],
    type: 'foobaraccount',
    accountType: 'foo',
    authorized: true,
    challengeDestructiveActions: true,
    environment: 'foo-env',
    primaryAccount: true,
    regions: [],
  };
}

describe('providerSelectionService: API', () => {

  let cloudProvider: any;
  beforeEach(
    mock.module(
      CLOUD_PROVIDER_REGISTRY,
      function (cloudProviderRegistryProvider: any) {
        cloudProvider = cloudProviderRegistryProvider;
      }
    )
  );

  beforeEach(mock.module(APPLICATION_MODEL_BUILDER, PROVIDER_SELECTION_SERVICE, ACCOUNT_SERVICE));

  // required to ensure registry provider is available
  let $q: IQService,
      $scope: IScope,
      $modal: IModalService,
      accountService: AccountService,
      cloudProviderRegistry: CloudProviderRegistry,
      providerService: ProviderSelectionService,
      applicationBuilder: ApplicationModelBuilder;
  beforeEach(
    mock.inject(
      (_$q_: IQService, $rootScope: IRootScopeService, _$uibModal_: IModalService, _accountService_: AccountService, _cloudProviderRegistry_: CloudProviderRegistry, _providerSelectionService_: ProviderSelectionService, _applicationModelBuilder_: ApplicationModelBuilder) => {
        $q = _$q_;
        $scope = $rootScope.$new();
        $modal = _$uibModal_;
        accountService = _accountService_;
        cloudProviderRegistry = _cloudProviderRegistry_;
        providerService = _providerSelectionService_;
        applicationBuilder = _applicationModelBuilder_;
      }));

  let hasValue: boolean,
    accounts: IAccountDetails[];
  beforeEach(() => {
    spyOn(accountService, 'applicationAccounts').and.callFake(() => $q.when(accounts));
    spyOn(cloudProviderRegistry, 'hasValue').and.callFake(() => hasValue);
    spyOn($modal, 'open').and.callFake(() => {
      return {
        result: $q.when('modalProvider')
      };
    });
  });

  beforeEach(() => {
    SETTINGS.providers.testProvider = {
      defaults: {
        account: 'testProviderAccount',
        region: 'testProviderRegion'
      }
    };
  });

  afterEach(SETTINGS.resetToOriginal);

  let application: Application,
      config: any;
  beforeEach(() => {

    hasValue = false;
    accounts = [];
    delete SETTINGS.defaultProvider;

    application = applicationBuilder.createApplication('app');
    application.attributes = { cloudProviders: 'testProvider' };

    config = {
      name: 'testProvider',
      securityGroup: {}
    };
  });

  it('should use the specified, default provider if the requested provider cannot be found', () => {

    let provider = '';
    SETTINGS.defaultProvider = 'defaultProvider';

    cloudProvider.registerProvider('fakeProvider', config);
    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('defaultProvider');
  });

  it('should use "aws" as the default provider if the requested provider cannot be found and there is no default set', () => {

    let provider = '';
    cloudProvider.registerProvider('fakeProvider', config);
    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('aws');
  });

  it('should return the specified provider if that provider is registered', () => {

    let provider = '';
    hasValue = true;
    accounts = [fakeAccount('testProvider')];
    cloudProvider.registerProvider('testProvider', config);
    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('testProvider');
  });

  it('should return the "use provider" value instead of the configured one if one is specified', () => {

    let provider = '';
    hasValue = true;
    accounts = [fakeAccount('testProvider')];
    config.securityGroup.useProvider = 'titus';
    cloudProvider.registerProvider('testProvider', config);
    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('titus');
  });

  it('should use the specified provider from the configuration', () => {

    let provider = '';
    hasValue = true;
    accounts = [fakeAccount('aws'), fakeAccount('titus')];
    cloudProvider.registerProvider('aws', { securityGroup: {} });
    cloudProvider.registerProvider('titus', { securityGroup: { useProvider: 'aws' } });

    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('aws');
  });

  it('should use the provider "selected" from the "modal"', () => {

    let provider = '';
    hasValue = true;
    accounts = [fakeAccount('aws'), fakeAccount('titus'), fakeAccount('testProvider')];
    cloudProvider.registerProvider('aws', { securityGroup: {} });
    cloudProvider.registerProvider('titus', { securityGroup: { useProvider: 'aws' } });
    cloudProvider.registerProvider('testProvider', config);

    providerService.selectProvider(application, 'securityGroup').then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('modalProvider');
  });

  it('should not return a filtered provider', () => {
    let provider = '';
    hasValue = true;
    const k8s = fakeAccount('kubernetes');
    k8s.providerVersion = 'v2';
    accounts = [k8s];
    cloudProvider.registerProvider('kubernetes', config);
    SETTINGS.defaultProvider = 'defaultProvider';

    const filterFn = (_app: Application, acc: IAccountDetails) => acc.cloudProvider !== 'kubernetes';
    providerService.selectProvider(application, 'securityGroup', filterFn).then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('defaultProvider');
  });

  it('should not launch a modal if one of two providers is filtered out by filter function', () => {
    let provider = '';
    hasValue = true;
    const k8s = fakeAccount('kubernetes');
    k8s.providerVersion = 'v2';
    accounts = [k8s, fakeAccount('titus')];
    cloudProvider.registerProvider('titus', config);
    cloudProvider.registerProvider('kubernetes', config);

    const filterFn = (_app: Application, acc: IAccountDetails) =>  acc.cloudProvider !== 'kubernetes';
    providerService.selectProvider(application, 'securityGroup', filterFn).then((_provider) => {
      provider = _provider;
    });
    $scope.$digest();
    expect(provider).toBe('titus');
  });
});
