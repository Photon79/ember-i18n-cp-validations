import Ember from 'ember';
import ENV from '../config/environment';
import ValidatorsMessages from '../validators/messages';

const {
  Handlebars,
  warn,
  computed,
  isPresent,
  isEmpty,
  isNone,
  get,
  String: {
    isHTMLSafe
  }
} = Ember;

function isSafeString(input) {
  return typeof isHTMLSafe === 'function' ? isHTMLSafe(input) : input instanceof Handlebars.SafeString;
}

function unwrap(input) {
  if (isSafeString(input)) {
    return input.toString();
  }

  return input;
}

function emitWarning(msg, meta) {
  if (!get(ENV, 'i18n.suppressWarnings')) {
    warn(msg, meta);
  }
}

export function initialize(appInstance) {
  const i18n = appInstance.__container__.lookup('service:i18n');

  ValidatorsMessages.reopen({
    i18n,
    _regex: /\{\{(\w+)\}\}|\{(\w+)\}/g,

    _prefix: computed('prefix', function() {
      const prefix = get(this, 'prefix');

      if (typeof prefix === 'string') {
        if (prefix.length) {
          return prefix + '.';
        }

        return prefix;
      }

      return 'errors.';
    }),

    getDescriptionFor(attribute, context = {}) {
      const prefix = get(this, '_prefix');
      let key = `${prefix}description`;
      let setDescriptionKey;

      if (!isEmpty(context.descriptionKey)) {
        key = context.descriptionKey;
        setDescriptionKey = true;
      } else if (!isEmpty(context.description)) {
        return context.description;
      }

      const i18n = get(this, 'i18n');

      if (i18n && i18n.exists(key)) {
        return unwrap(i18n.t(key, context));
      }

      if (setDescriptionKey) {
        emitWarning(`Custom descriptionKey ${key} provided but does not exist in i18n translations.`, {
          id: 'ember-i18n-cp-validations-missing-description-key'
        });
      }

      return this._super(...arguments);
    },

    getMessageFor(type, context = {}) {
      const i18n = get(this, 'i18n');
      const prefix = get(this, '_prefix');
      const key = isPresent(context.messageKey) ? context.messageKey : `${prefix}${type}`;

      if (i18n && i18n.exists(key)) {
        return unwrap(i18n.t(key, context));
      }

      emitWarning(`[ember-i18n-cp-validations] Missing translation for validation key: ${key}\nhttp://offirgolan.github.io/ember-cp-validations/docs/messages/index.html`, {
        id: 'ember-i18n-cp-validations-missing-translation'
      });

      return this._super(...arguments);
    },

    formatMessage(message, context) {
      let m = message;

      if (isNone(m) || typeof m !== 'string') {
        m = get(this, 'invalid');
      }

      return m.replace(get(this, '_regex'), (s, p1, p2) => {
        return get(context, p1 || p2);
      });
    }
  });
}

export default {
  name: 'ember-i18n-cp-validations',
  initialize
};
