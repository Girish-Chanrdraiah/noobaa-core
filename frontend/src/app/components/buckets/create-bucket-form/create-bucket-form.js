import template from './create-bucket-form.html';
import ko from 'knockout';
import { bucketList } from 'model';
import { isFunction, noop } from 'utils';
import { createBucket } from 'actions';

// const bucketNamePattern = '^[a-z0-9](-|[a-z0-9]){2,62}$';
// const sizeUnits = [ 
// 	{ label: 'GB', value: 3 },
// 	{ label: 'TB', value: 4 },
// 	{ label: 'PB', value: 5 },
// ];

const bucketNameValidationRules = [
	{
		validator: ko.validation.rules.required.validator,
		message: 'Name cannot be empty.'
	},
	{
		validator: ko.validation.rules.minLength.validator,
		message: 'Name must be between 3 and 36 characters.',
		params: 3
	},
	{
		validator: ko.validation.rules.maxLength.validator,
		message: 'Name must be between 3 and 36 characters.',
		params: 36
	},
	{ 
		validator: name => !name.includes('..'),
		message: 'Name cannot contain two adjacent periods.'
	},
	{
		validator: name => !name.includes('.-') && !name.includes('-.'),
		message: 'Name cannot contain dashes next to periods.'
	},
	{
		validator: name => name === name.toLowerCase(),
		message: 'Name cannot contain uppercase characters.'
	},
	{
		validator: name => !/\s/.test(name),
		message: 'Name cannot contain a whitespace.'
	},
	{
		validator: name => /^[a-z0-9].*[a-z0-9]$/.test(name),
		message: 'Name must start and end with a letter or number.'
	},
	{
		validator: name => !/^\d+\.\d+\.\d+\.\d+$/.test(name),
		message: 'Name cannot be in the form of an IP address'
	},
	{
		validator: name => bucketList().every(bucket => bucket.name !== name),
		message: 'A bucket with the same name already exist.'
	}
];

class CreateBucketFormViewModel {
	constructor({ oncomplete }) {
		this.oncomplete = isFunction(oncomplete) ? oncomplete : noop;

		this.bucketName = ko.observable().extend({
			validation: bucketNameValidationRules
		});

		this.limitQuota = ko.observable(true);
		// this.quotaValue = ko.observable(1);
		// this.quotaUnit = ko.observable(sizeUnits[0]);
		// this.sizeUnits = sizeUnits;
		
		// The actual qouta in bytes.
		// this.quota = ko.pureComputed(() => {
		// 	return this.limitQuota() ? 
		// 		this.quotaValue() * 1024 ** this.quotaUnit().value :
		// 		-1;
		// });

		// Validation error group.
		this.errors = ko.validation.group(this);
	}

	create() {
		if (this.errors().length === 0) {
			createBucket(this.bucketName());
			this.oncomplete();
		} else {
			this.errors.showAllMessages(true);
		}
	}

	cancel() {
		this.oncomplete();
	}
}

export default {
	viewModel: CreateBucketFormViewModel,
	template: template
};