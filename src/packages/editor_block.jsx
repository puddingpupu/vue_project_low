import { computed, defineComponent, inject, ref, onMounted } from "vue";
import BlockResize from "./block_resize";

export default defineComponent({
    props: {
        block: { type: Object },
        formData: { type: Object }
    },
    setup(props) {
        const blockStyles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: `${props.block.zIndex}`
        }));
        const config = inject('config')

        const blockRef = ref(null)
        onMounted(() => {
            let { offsetWidth, offsetHeight } = blockRef.value;
            if (props.block.alignCenter) {//说明拖拽松手的时候渲染的 其他默认在的不需要
                props.block.left = props.block.left - offsetWidth / 2;
                props.block.top = props.block.top - offsetHeight / 2;
                props.block.alignCenter = false;//让渲染后的结果居中
            }
            props.block.width = offsetWidth;
            props.block.height = offsetHeight;

        })

        return () => {
            const component = config.componentMap[props.block.key];
            const RenderComponent = component.render({
                size:props.block.hasResize?{width:props.block.width,height:props.block.height}:'',
                props: props.block.props,
                // model:props.block.model=>{default:'username'}=>{modelValue:FormData.username,"onUpdate:modelValue":v=>FormData.username=v}

                model: Object.keys(component.model || {}).reduce((prev, modelName) => {


                    // console.log(prev)
                    let propName = props.block.model[modelName];


                    prev[modelName] = {
                        //通过在操纵栏的输入框里输入字段名获取字段值赋值给modelValue
                        modelValue: props.formData[propName],
                        // "onUpdate:modelValue"是一个双向绑定函数 当modelValue值发生改变的时候 会调用函数来更新props.formData[propName]的值以此来实现双向绑定
                        "onUpdate:modelValue": v => props.formData[propName] = v
                    }
                    return prev;
                }, {})
            });
            const { width, height } = component.resize || {}

            return (<div class="editor_block" style={blockStyles.value} ref={blockRef}>
                {RenderComponent}
                {/* 传递block是为了修改当前block的宽高，component中存放了修改宽还是高 */}
                {props.block.focus && (width || height) &&
                    <BlockResize
                        block={props.block}
                        component={component}
                    >
                    </BlockResize>}
            </div>)
        }

    }
})