import { BookOpen, Map, User } from 'lucide-vue-next';
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const tabs = computed(() => [
    { to: localePath('/seasons'), label: t('nav.seasons'), icon: Map },
    { to: localePath('/passport'), label: t('nav.passport'), icon: BookOpen },
    { to: localePath('/profile'), label: t('nav.profile'), icon: User }
]);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper pb-[env(safe-area-inset-bottom)]" },
});
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-ink/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-paper']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-[env(safe-area-inset-bottom)]']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mx-auto grid max-w-md grid-cols-3" },
});
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-3']} */ ;
for (const [tab] of __VLS_vFor((__VLS_ctx.tabs))) {
    let __VLS_0;
    /** @ts-ignore @type { | typeof __VLS_components.NuxtLink | typeof __VLS_components.NuxtLink} */
    NuxtLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        key: (tab.to),
        to: (tab.to),
        'aria-current': (__VLS_ctx.route.path === tab.to ? 'page' : undefined),
        ...{ class: "flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold" },
        ...{ class: (__VLS_ctx.route.path === tab.to ? 'text-accent' : 'text-ink-soft') },
    }));
    const __VLS_2 = __VLS_1({
        key: (tab.to),
        to: (tab.to),
        'aria-current': (__VLS_ctx.route.path === tab.to ? 'page' : undefined),
        ...{ class: "flex min-h-[44px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold" },
        ...{ class: (__VLS_ctx.route.path === tab.to ? 'text-accent' : 'text-ink-soft') },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-[44px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    const { default: __VLS_5 } = __VLS_3.slots;
    const __VLS_6 = (tab.icon);
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }));
    const __VLS_8 = __VLS_7({
        ...{ class: "size-5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (tab.label);
    // @ts-ignore
    [tabs, route, route,];
    var __VLS_3;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
