export function ZnForm (plugin) {

    plugin.factory('znForm', [
        function () {

            var znForm = this;

            znForm.getFullLinkedForms = function (form, forms, forTypes) {

                var relatedForms = [];

                if (!form || !form.linkedForms) {
                    return relatedForms;
                }

                forTypes = forTypes || ['hasOne', 'belongsTo', 'hasMany'];

                if (!Array.isArray(forTypes)) {
                    forTypes = [forTypes];
                }

                form.linkedForms.forEach(function (linkedForm) {
                    forms.forEach(function (form) {
                        if (form.id === linkedForm.form.id) {

                            if (forTypes.indexOf(linkedForm.type) === -1) {
                                return;
                            }

                            form.type = linkedForm.type;

                            relatedForms.push(form);
                        }
                    });
                });

                return relatedForms;

            };

            znForm.getLinkedForm = function (form, formId) {

                if (!form || !form.linkedForms) {
                    return false;
                }

                var result = form.linkedForms.find(function (linkedForm) {
                    return linkedForm.form.id == formId;
                });

                return result ? result : false;

            };

            /**
             * Attribute of Linked Field to Form Id
             *
             * @author  Wes DeMoney <wes@wizehive.com>
             * @since   0.5.103
             */
            znForm.getLinkedFormAttribute = function (form, formId) {

                var retrievedForm = znForm.getLinkedForm(form, formId);

                if (!retrievedForm) {
                    return false;
                }

                return 'field' + retrievedForm.keyField.id;

            };

            znForm.getSortedLinkedForms = function (form, forms) {

                if (!form || !form.linkedForms) {
                    return;
                }

                var fields = form.fields || [],
                    linkedForms = form.linkedForms;

                var linkedFields = fields.filter(function (field) {
                    return field.type === 'linked';
                });

                // Merge Linked Forms with Form and Field Orders
                var related = linkedForms.map(function (link) {

                    if (link.type === 'belongsTo') {

                        var linkedField = linkedFields.find(function (field) {
                            return field.id == link.keyField.id;
                        });

                        if (linkedField) {
                            link.keyField.order = linkedField.order;
                        }

                    }
                    else {

                        var form = forms.find(function (form) {
                            return form.id == link.form.id;
                        });

                        if (form) {
                            link.form.order = form.order;
                        }

                    }

                    return link;

                });

                var sortFn = function (a, b) {
                    if (a < b) {
                        return -1;
                    }
                    else if (a > b) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                };

                related.sort(function (a, b) {

                    if (a.type === 'belongsTo') {

                        if (b.type !== 'belongsTo') {
                            // belongsTo Comes Before Other Types
                            return -1;
                        }
                        else {
                            // Sort belongsTo by Field Order
                            return sortFn(a.keyField.order, b.keyField.order);
                        }

                    }
                    else {

                        if (b.type === 'belongsTo') {
                            // belongsTo Comes Before Other Types
                            return 1;
                        }
                        else {
                            // Sort hasOne and hasMany by Form Order
                            return sortFn(a.form.order, b.form.order);
                        }

                    }

                });

                return related;

            };

            return znForm;
        }
    ]);
}