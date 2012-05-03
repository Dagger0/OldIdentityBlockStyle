EXTDIR    := ext/
BUILDDIR  := build/
FILES     := $(shell find ${EXTDIR}/ -type f) ${GEN_FILES}

NAME      := $(shell sed -nre 's/.*em:name="(.+?)".*/\1/p;' ${EXTDIR}/install.rdf | head -n1)
ID        := $(shell sed -nre 's/.*em:id="(.+?)".*/\1/p;' ${EXTDIR}/install.rdf | head -n1)
VERSION   := $(shell sed -nre 's/.*em:version="(.+?)".*/\1/p;' ${EXTDIR}/install.rdf | head -n1)
MINVER    := $(shell sed -nre 's/.*em:minVersion="(.+?)".*/\1/p;' ${EXTDIR}/install.rdf | head -n1)
MAXVER    := $(shell sed -nre 's/.*em:maxVersion="(.+?)".*/\1/p;' ${EXTDIR}/install.rdf | head -n1)

EXTRA     := ${ID}

SHORTNAME := $(shell echo ${ID}   | sed -re 's/@.+//')
FNAME     := $(shell echo ${NAME} | sed -re "s/[/ ]//g")
PXPI      := ${FNAME}_${VERSION}.xpi
XPI       := $(addprefix ${BUILDDIR},${PXPI})

SUBST_CMD := sed -re "s/%ID%/${ID}/g" -e "s/%NAME%/${NAME}/g" -e "s/%FNAME%/${FNAME}/g" -e "s/%SHORTNAME%/${SHORTNAME}/g" \
		-e "s/%XPI%/${PXPI}/g" -e "s/%VERSION%/${VERSION}/g" -e "s/%MINVER%/${MINVER}/g" -e "s/%MAXVER%/${MAXVER}/g"

.PHONY : clean all
all : ${XPI} $(addprefix ${BUILDDIR}, ${EXTRA})

${XPI}: ${FILES}
	mv ${EXTDIR}/bootstrap.js ${EXTDIR}/bootstrap.js.in
	cat ${EXTDIR}/bootstrap.js.in | sed -re "s|^//#|#|" | gcc -E -x c -P -C -traditional-cpp - > ${EXTDIR}/bootstrap.js
	diff -u ${EXTDIR}/bootstrap.js.in ${EXTDIR}/bootstrap.js || true
	cd ${EXTDIR} && 7z a -tzip -r -mx=9 -x\!\*.bak -x\!\*.in "../$@" *
	mv ${EXTDIR}/bootstrap.js.in ${EXTDIR}/bootstrap.js

$(addprefix ${BUILDDIR}, ${ID}): ${EXTDIR}/install.rdf
	(cygpath -aw ${EXTDIR} || echo `pwd`/${EXTDIR}) > $(addprefix ${BUILDDIR}, ${ID})

clean:
	rm -rf ${BUILDDIR}
