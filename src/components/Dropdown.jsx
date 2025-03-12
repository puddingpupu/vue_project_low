import { provide,inject,computed, createVNode, defineComponent, onMounted, reactive, render, ref, onBeforeUnmount } from "vue";


export const DropdownItem = defineComponent({
    props: {
        label: String,
        icon: String
    }, 
    setup(props) {
        let {label,icon}=props
        let hide=inject('hide')
        return ()=><div class="dropdown-item" onClick={hide}>
            <i class={icon}></i>
            <span>{label}</span>
        </div>
    }
})
const DropdownComponent = defineComponent({
    props: {
        option: { type: Object }
    },

    setup(props, ctx) {
        const state = reactive({
            option: props.option,
            isShow: false,
            top: 0,
            left: 0
        })
        ctx.expose({
            showDropdown(option) {
                state.option = option;
                state.isShow = true;
                let { top, left, height } = option.el.getBoundingClientRect();
                state.top = top + height;
                state.left = left;

            }
        });
        provide('hide',()=>state.isShow=false)
        const classes = computed(() => [
            //始终应用dropdown类 并根据state.isShow的值来判断是否使用dropdown_isShow
            'dropdown',
            {
                'dropdown_isShow': state.isShow
            }
        ])
        const styles = computed(() => ({
            top: state.top + 'px',
            left: state.left + 'px'
        }))
        const el = ref(null)
        const onMousedownDocument = (e) => {
            if (!el.value.contains(e.target)) {
                console.log(122)
                state.isShow = false//如果点击的是下拉菜单内部 什么都不做
            }
        }
        onMounted(() => {
            //事件的传递行为是先捕获再冒泡
            document.body.addEventListener('mousedown', onMousedownDocument, true)
        })
        onBeforeUnmount(() => {
            document.body.removeEventListener('mousedown', onMousedownDocument)
        })
        return () => {
            return <div class={classes.value} style={styles.value} ref={el}>
                {state.option.content()}
            </div>
        }
    }
})

let vm;
export function $dropdown(option) {
    if (!vm) {
        let el = document.createElement('div');
        vm = createVNode(DropdownComponent,{ option });
        document.body.appendChild((render(vm, el), el))
    }


    //将组建渲染到el元素上
    let { showDropdown } = vm.component.exposed
    showDropdown(option)
}