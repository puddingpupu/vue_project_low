# vue_project_low
低代码平台构造思路
创造一个大框架，根据ui图分为三个作用区，通过import和export将作用区与大框架连接起来
做一个data用于存放更改的数据 并导入到最大框架 进行渲染 方便后续使用
做一个util物料组件用于存放左侧拖动栏的插件

组件传输{
A．import export 显式传输 
B．provide inject 依赖传输 用于父组件向子组件传输数据
}

Editor-config文件包含了所有低代码平台需要的组件配置 将它导入到App.vue文件中 作为父级对其他组件可以更方便更优先的重复利用

功能一 拖拽松手组件放到固定位置
  创造四个作用函数 分别代表鼠标进入区域 经过区域 离开区域 松开鼠标四个状态 通过对鼠标的监控来改变组件的状态
Draggable： h5自带的拖拽属性
onDragstart={e => dragstart(e, component)}
onDragstart是web的拖拽属性中之一 在检测到开始拖拽的时候 触发后面的箭头函数 以监控鼠标e为参数 并返回e和它拖拽的元素信息

先将拖拽区域用ref引用获取 然后传递他的数据到拖拽操作组件中 当鼠标进入拖拽区域并触发web拖拽属性 例如dragenter、dragover、dragleave、drop时，触发对应的自定义函数，使拖拽元素发生变化（例如由不可拖拽变成可拖拽，放下时将鼠标拖拽的元素放到对应的位置）

Drop操作 在拖拽时将拖拽的元素存起来：currentComponent = component
通过这段代码 来实现在整个画布data值的blocks数组中添加新的变量
data.value = {
            ...data.value, blocks: [
                ...blocks, {
                    top: e.offsetY,
                    left: e.offsetX,
                    zIndex: 1,
                    key: currentComponent.key,
                    alignCenter: true,
                    props:{},
                    model:{}
                }
            ]
        }

在画布上设置一个触发事件‘update：modelvalue’ 当modelvalue发生改变的时候 就触发这个事件 并赋给新值 这个新值用data的计算属性中的set赋予

最初给data使用计算属性赋值时，可以预想到data是一个随时可变动的值，如果为计算属性提供了一个set函数，那么当尝试给计算属性赋值时，触发了 ‘update：modelvalue’，将新元素派发出去 页面更新 拖拽的元素就被放置到页面上了
双向绑定 ，

在Vue中，update:modelValue 是一个自定义事件名，它通常与 .sync 修饰符一起使用，用于在子组件中更新父组件通过 v-model 绑定的值

一个功能需要有他自己的生命周期 比如拖拽功能 拖拽开始的时候赋予dragstart 结束的时候触发dragend来清除事件避免事件堆积


功能二 模块获取焦点和多个选中

获取焦点时给模块赋予onfocus属性 同时遍历blocks数组，将里面的所有模块的focus属性都赋给false 只给获取焦点的赋予true

使用e.ctrlKey来获取当按住ctrl键的时候 鼠标点击的模块focus属性变化 可以实现多个模块同时获取焦点
使用计算属性设置两个数组 focusData unfocusData 对blocks进行遍历 通过focus属性分到两个数组中
当focusData数组中存在block组件时 锁定最后一个被选中组件，收集鼠标在XY轴移动的距离和最后一个被选中组件的方位 以最后一个被选中组件的移动作为参照物进行计算移动距离 遍历focusData数组对组件的left和top值进行更改

使用computed属性的都是响应式数据 可以随着数据的更改而变化

撤销功能
注册数组用来存放操作 索引用于指针操作
先resitry注册重做和撤销事件 将按钮和事件绑定  
注册事件源 在拖拽事件时和松手时分别发送事件 
注册拖拽和松手事件 把重做和撤销事件放入功能内
初始化设置前一个状态 监控到拖拽开始 把data中已存入的blocks赋值给before 拖拽结束后存入拖拽的blocks  触发drag的execute事件  
Excute中将刚刚赋值的before给before 将刚刚存入的拖拽元素给after 当触发redo和undo两个事件时 分别将before和after传递给他们
State是对整个模块的状态管理

这段的emit过程分析
props: {
        modelValue: { type: Object },
        formData: { type: Object }
    },
    emits: ['update:modelValue'],
    setup(props, ctx) {
        //预览模式 开启的时候无法操作内容

        const previewRef = ref(false);
        const editorRef = ref(true);

        const data = computed({
            get() {
                return props.modelValue
            },
            set(newValue) {
                ctx.emit('update:modelValue', deepcopy(newValue))
            }
        });
当 data 的 set 方法被调用时（这通常发生在某个地方修改了 data 的值，尽管这里没有直接展示），它会执行 ctx.emit('update:modelValue', deepcopy(newValue))。
ctx 是 setup 函数的第二个参数，它包含了组件的上下文信息，包括用于触发事件的方法 emit。
'update:modelValue' 是要触发的事件名称。在 Vue 中，以 update: 开头的事件名称通常用于 .sync 修饰符或 v-model 的双向绑定。这意味着父组件可以使用 v-model 绑定到 modelValue prop 上，并自动接收 update:modelValue 事件来更新绑定的值。
deepcopy(newValue) 是传递给事件处理函数的参数，用于确保传递给父组件的是新值的一个独立副本，而不是原始值的引用。

        
