"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNewsletterMetadata = exports.makeNewsletterSocket = void 0;
const Types_1 = require("../Types");
const Utils_1 = require("../Utils");
const WABinary_1 = require("../WABinary");
const groups_1 = require("./groups");
const makeNewsletterSocket = (config) => {
    const sock = (0, groups_1.makeGroupsSocket)(config);
    const { authState, signalRepository, query, generateMessageTag } = sock;
    const encoder = new TextEncoder();
    const newsletterQuery = (jid, type, content) => __awaiter(void 0, void 0, void 0, function* () {
        return (query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type,
                xmlns: 'newsletter',
                to: jid,
            },
            content
        }));
    });
    const newsletterWMexQuery = (jid, queryId, content) => __awaiter(void 0, void 0, void 0, function* () {
        return (query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type: 'get',
                xmlns: 'w:mex',
                to: WABinary_1.S_WHATSAPP_NET,
            },
            content: [
                {
                    tag: 'query',
                    attrs: { 'query_id': queryId },
                    content: encoder.encode(JSON.stringify({
                        variables: Object.assign({ 'newsletter_id': jid }, content)
                    }))
                }
            ]
        }));
    });
    const parseFetchedUpdates = (node, type) => __awaiter(void 0, void 0, void 0, function* () {
        let child;
        if (type === 'messages') {
            child = (0, WABinary_1.getBinaryNodeChild)(node, 'messages');
        }
        else {
            const parent = (0, WABinary_1.getBinaryNodeChild)(node, 'message_updates');
            child = (0, WABinary_1.getBinaryNodeChild)(parent, 'messages');
        }
        return yield Promise.all((0, WABinary_1.getAllBinaryNodeChildren)(child).map((messageNode) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            messageNode.attrs.from = child === null || child === void 0 ? void 0 : child.attrs.jid;
            const views = parseInt(((_b = (_a = (0, WABinary_1.getBinaryNodeChild)(messageNode, 'views_count')) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.count) || '0');
            const reactionNode = (0, WABinary_1.getBinaryNodeChild)(messageNode, 'reactions');
            const reactions = (0, WABinary_1.getBinaryNodeChildren)(reactionNode, 'reaction')
                .map(({ attrs }) => ({ count: +attrs.count, code: attrs.code }));
            const data = {
                'server_id': messageNode.attrs.server_id,
                views,
                reactions
            };
            if (type === 'messages') {
                const { fullMessage: message, decrypt } = yield (0, Utils_1.decryptMessageNode)(messageNode, authState.creds.me.id, authState.creds.me.lid || '', signalRepository, config.logger);
                yield decrypt();
                data.message = message;
            }
            return data;
        })));
    });
    return Object.assign(Object.assign({}, sock), { subscribeNewsletterUpdates: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const result = yield newsletterQuery(jid, 'set', [{ tag: 'live_updates', attrs: {}, content: [] }]);
            return (_a = (0, WABinary_1.getBinaryNodeChild)(result, 'live_updates')) === null || _a === void 0 ? void 0 : _a.attrs;
        }), newsletterReactionMode: (jid, mode) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.JOB_MUTATION, {
                updates: { settings: { 'reaction_codes': { value: mode } } }
            });
        }), newsletterUpdateDescription: (jid, description) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.JOB_MUTATION, {
                updates: { description: description || '', settings: null }
            });
        }), newsletterUpdateName: (jid, name) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.JOB_MUTATION, {
                updates: { name, settings: null }
            });
        }), newsletterUpdatePicture: (jid, content) => __awaiter(void 0, void 0, void 0, function* () {
            const { img } = yield (0, Utils_1.generateProfilePicture)(content);
            yield newsletterWMexQuery(jid, Types_1.QueryIds.JOB_MUTATION, {
                updates: { picture: img.toString('base64'), settings: null }
            });
        }), newsletterRemovePicture: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.JOB_MUTATION, {
                updates: { picture: '', settings: null }
            });
        }), newsletterUnfollow: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.UNFOLLOW);
        }), newsletterFollow: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.FOLLOW);
        }), newsletterUnmute: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.UNMUTE);
        }), newsletterMute: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.MUTE);
        }), newsletterAction: (jid, type) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, type.toUpperCase());
        }), newsletterCreate: (name, description, reaction_codes) => __awaiter(void 0, void 0, void 0, function* () {
            //TODO: Implement TOS system wide for Meta AI, communities, and here etc.
            /**tos query */
            yield query({
                tag: 'iq',
                attrs: {
                    to: WABinary_1.S_WHATSAPP_NET,
                    xmlns: 'tos',
                    id: generateMessageTag(),
                    type: 'set'
                },
                content: [
                    {
                        tag: 'notice',
                        attrs: {
                            id: '20601218',
                            stage: '5'
                        },
                        content: []
                    }
                ]
            });
            const result = yield newsletterWMexQuery(undefined, Types_1.QueryIds.CREATE, {
                input: { name, description, settings: { 'reaction_codes': { value: reaction_codes.toUpperCase() } } }
            });
            return (0, exports.extractNewsletterMetadata)(result, true);
        }), newsletterMetadata: (type, key, role) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield newsletterWMexQuery(undefined, Types_1.QueryIds.METADATA, {
                input: {
                    key,
                    type: type.toUpperCase(),
                    'view_role': role || 'GUEST'
                },
                'fetch_viewer_metadata': true,
                'fetch_full_image': true,
                'fetch_creation_time': true
            });
            return (0, exports.extractNewsletterMetadata)(result);
        }), newsletterAdminCount: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const result = yield newsletterWMexQuery(jid, Types_1.QueryIds.ADMIN_COUNT);
            const buff = (_b = (_a = (0, WABinary_1.getBinaryNodeChild)(result, 'result')) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.toString();
            return JSON.parse(buff).data[Types_1.XWAPaths.ADMIN_COUNT].admin_count;
        }), 
        /**user is Lid, not Jid */
        newsletterChangeOwner: (jid, user) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.CHANGE_OWNER, {
                'user_id': user
            });
        }), 
        /**user is Lid, not Jid */
        newsletterDemote: (jid, user) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.DEMOTE, {
                'user_id': user
            });
        }), newsletterDelete: (jid) => __awaiter(void 0, void 0, void 0, function* () {
            yield newsletterWMexQuery(jid, Types_1.QueryIds.DELETE);
        }), 
        /**if code wasn't passed, the reaction will be removed (if is reacted) */
        newsletterReactMessage: (jid, serverId, code) => __awaiter(void 0, void 0, void 0, function* () {
            yield query({
                tag: 'message',
                attrs: Object.assign(Object.assign({ to: jid }, (!code ? { edit: '7' } : {})), { type: 'reaction', 'server_id': serverId, id: (0, Utils_1.generateMessageID)() }),
                content: [{
                        tag: 'reaction',
                        attrs: code ? { code } : {}
                    }]
            });
        }), newsletterFetchMessages: (type, key, count, after) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield newsletterQuery(WABinary_1.S_WHATSAPP_NET, 'get', [
                {
                    tag: 'messages',
                    attrs: Object.assign(Object.assign({ type }, (type === 'invite' ? { key } : { jid: key })), { count: count.toString(), after: (after === null || after === void 0 ? void 0 : after.toString()) || '100' })
                }
            ]);
            return yield parseFetchedUpdates(result, 'messages');
        }), newsletterFetchUpdates: (jid, count, after, since) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield newsletterQuery(jid, 'get', [
                {
                    tag: 'message_updates',
                    attrs: { count: count.toString(), after: (after === null || after === void 0 ? void 0 : after.toString()) || '100', since: (since === null || since === void 0 ? void 0 : since.toString()) || '0' }
                }
            ]);
            return yield parseFetchedUpdates(result, 'updates');
        }) });
};
exports.makeNewsletterSocket = makeNewsletterSocket;
const extractNewsletterMetadata = (node, isCreate) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const result = (_b = (_a = (0, WABinary_1.getBinaryNodeChild)(node, 'result')) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.toString();
    const metadataPath = JSON.parse(result).data[isCreate ? Types_1.XWAPaths.CREATE : Types_1.XWAPaths.NEWSLETTER];
    const metadata = {
        id: metadataPath.id,
        state: metadataPath.state.type,
        'creation_time': +metadataPath.thread_metadata.creation_time,
        name: metadataPath.thread_metadata.name.text,
        nameTime: +metadataPath.thread_metadata.name.update_time,
        description: metadataPath.thread_metadata.description.text,
        descriptionTime: +metadataPath.thread_metadata.description.update_time,
        invite: metadataPath.thread_metadata.invite,
        handle: metadataPath.thread_metadata.handle,
        picture: ((_c = metadataPath.thread_metadata.picture) === null || _c === void 0 ? void 0 : _c.direct_path) || null,
        preview: ((_d = metadataPath.thread_metadata.preview) === null || _d === void 0 ? void 0 : _d.direct_path) || null,
        'reaction_codes': (_g = (_f = (_e = metadataPath.thread_metadata) === null || _e === void 0 ? void 0 : _e.settings) === null || _f === void 0 ? void 0 : _f.reaction_codes) === null || _g === void 0 ? void 0 : _g.value,
        subscribers: +metadataPath.thread_metadata.subscribers_count,
        verification: metadataPath.thread_metadata.verification,
        'viewer_metadata': metadataPath.viewer_metadata
    };
    return metadata;
};
exports.extractNewsletterMetadata = extractNewsletterMetadata;