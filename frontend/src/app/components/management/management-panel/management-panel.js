import template from './management-panel.html';
import Disposable from 'disposable';
import ko from 'knockout';
import { uiState } from 'model';

class ManagementPanelViewModel extends Disposable {
    constructor() {
        super();

        this.selectedTab = ko.pureComputed(
            () => uiState().tab
        );
    }

    tabHref(tab) {
        return {
            route: 'management',
            params: { tab }
        };
    }

    tabCss(tab) {
        return {
            selected: this.selectedTab() === tab
        };
    }
}

export default {
    viewModel: ManagementPanelViewModel,
    template: template
};
