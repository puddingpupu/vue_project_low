import { ElFormItem, ElButton, ElForm, ElInputNumber, ElInput, ElColorPicker, ElSelect, ElOption } from "element-plus";
import { defineComponent, reactive, watch } from "vue";
import { inject } from "vue";
import deepcopy from "deepcopy";
import TableEditor from "./table_editor";



export default defineComponent({
    props: {
        block: { type: Object },//最后选中的数据
        data: { type: Object },//当前所有的数据
        updateContainer:{type:Function},
        updateBlock:{type:Function},
    },
    setup(props, ctx) {
        const config = inject('config');//组件配置信息
        const state=reactive({
            editData:{}
        })
        const reset =()=>{
            if(!props.block){
                
                state.editData=deepcopy(props.data.container)
            }
            else{
                state.editData=deepcopy(props.block)
            }
        }
        const apply =()=>{
            if(!props.block){
                //在后面的参数可以添加到参数1或覆盖
                props.updateContainer({...props.data,container:state.editData})
            }
            else{
               props.updateBlock(state.editData,props.block)
            }
        }
        watch(()=>props.block,reset,{immediate:true})
        return () => {
            let content = []
            if (!props.block) {
                content.push(<>
                    <ElFormItem label="容器宽度">
                        <ElInputNumber v-model={state.editData.width}>

                        </ElInputNumber>
                    </ElFormItem>
                    <ElFormItem label="容器高度">
                        <ElInputNumber v-model={state.editData.height}>

                        </ElInputNumber>
                    </ElFormItem>

                </>)
            } else {
                let component = config.componentMap[props.block.key];

                if (component && component.props) {
                    console.log(component.props)
                    content.push(
                        //.map方法遍历由Object.entries生成的数组。
                        //每次迭代都会接收一个数组（键值对），并将其解构为propName（属性名）和propConfig（属性配置）
                        Object.entries(component.props).map(([propName, propConfig]) => {
                            console.log(propName,propConfig)
                            return <ElFormItem label={propConfig.label}>
                                {{
                                    'input': () => <ElInput v-model={state.editData.props[propName]}></ElInput>,
                                    'color': () => <ElColorPicker v-model={state.editData.props[propName]}></ElColorPicker>,
                                    'select': () => <ElSelect v-model={state.editData.props[propName]} >
                                        {propConfig.options.map(opt => {
                                            return <ElOption label={opt.label} value={opt.value}></ElOption>
                                        })}
                                    </ElSelect>,
                                    table:()=><TableEditor propConfig={propConfig} v-model={state.editData.props[propName]}></TableEditor>
                                        
                                    //动态渲染表单控件:
                                    //接下来是一个对象字面量，其键是表单控件的类型（如'input'、'color'、'select'），值是返回对应表单控件组件的函数。
                                    //使用[propConfig.type]()这种语法访问对象属性，其中propConfig.type的值（如'input'）决定了要调用的函数。
                                    //例如，如果propConfig.type是'input'，则调用() => <ElInput></ElInput>，返回一个ElInput组件。
                                }[propConfig.type]()}

                            </ElFormItem>
                        })

                    )

                }

                if(component&&component.model){
                    content.push(Object.entries(component.model).map(([modelName,label])=>{
                        return <ElFormItem label={label}>
                            <ElInput v-model={state.editData.model[modelName]}></ElInput>
                        </ElFormItem>
                    }))
                }
            }

            return <ElForm labelPosition="top" style="padding:30px">
                {content}
                <ElFormItem>
                    <ElButton type="primary" onClick={()=>apply()}> 应用</ElButton>
                    <ElButton onClick={reset}> 重置</ElButton>
                </ElFormItem>
            </ElForm>

        }



    }
})