import { createVNode, defineComponent, reactive, render } from "vue"
import { ElButton, ElDialog, ElInput } from "element-plus"


const DialogComponent = defineComponent({
    props: {
        option: { type: Object }
    },
    setup(props, ctx) {
        const state = reactive({
            option: props.option,
            isShow: false
        })

        ctx.expose({
            showDialog(option) {
                state.option = option,
                state.isShow = true;
            }
        })
        const onCancel=()=>{
           
            state.isShow=false
        }
        const onConfirm=()=>{
            state.isShow=false
            state.option.onConfirm&&state.option.onConfirm(state.option.content)
        }
        return () => {

            return <ElDialog v-model={state.isShow} title={state.option.title}>
                {
                    {

                        default: () => <ElInput
                            type="textarea"
                            v-model={state.option.content}
                            rows={10}>
                        </ElInput>,
                        footer: () => state.option.footer && <div>
                            <ElButton onClick={onCancel}>取消</ElButton>
                            <ElButton type="primary" onClick={onConfirm}>确定</ElButton>
                        </div>
                    }
                }
            </ElDialog>

        }
    }
})

let vm;
export function $dialog(option) {
    //ElDialog是Element-Plus提供的一个对话框（Dialog）组件
    //ElDialog常用于用户交互场景，如确认操作、输入信息、展示提示信息等
    if (!vm) {
        let el = document.createElement('div');
        //创建虚拟节点
        vm = createVNode(DialogComponent, { option });

        //需要将el渲染到页面中
        document.body.appendChild((render(vm, el), el))
    }


    //将组建渲染到el元素上
    let { showDialog } = vm.component.exposed
    showDialog(option)
}